<div align="center">

# ReviewLens

### AI review insights for product teams

Turn customer reviews into a clear view of sentiment, recurring issues, product strengths, and reviews that need a response.

**CEDCOSS Technical Assessment · Associate Software Developer**

</div>

---

## Project overview

ReviewLens is a full-stack review-analysis dashboard. A store owner uploads a CSV, the backend cleans and stores its review rows, and OpenRouter analyses unique review text. If OpenRouter is rate-limited or unavailable, the backend can use Gemini as an independent fallback when a Gemini API key is configured. The dashboard summarizes the results and lets the owner draft a suggested reply when needed.

The application uses MongoDB Atlas for persistent data. MongoDB Compass can connect to the same Atlas cluster for database inspection. OpenRouter and Gemini requests are made by the backend only; the browser never receives or uses either API key.

| Area | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | Node.js, Express 5, ES modules |
| Database | MongoDB Atlas with Mongoose |
| AI providers | OpenRouter primary; optional Gemini fallback |
| Validation | Zod |
| CSV parsing and cleanup | `csv-parse`, `sanitize-html`, `he` |
| Automated tests | Node.js built-in test runner |

## Features

- Upload CSV files up to 5 MB and view a data-cleaning report.
- Skip empty review text, flag invalid required fields and repeated review IDs, and keep missing or invalid ratings as unknown.
- Detect repeated review text so identical feedback does not need separate AI analysis.
- Classify sentiment and topics, write a one-line English summary, and identify reviews that need a reply.
- Validate the AI response against a strict schema and retry invalid structured output once.
- Process unique reviews in groups with a maximum of five concurrent analysis calls; retry transient provider errors with exponential backoff.
- Reuse schema-validated analysis cache entries across repeated uploads.
- Explore sentiment shares, rating-versus-sentiment mismatches, top complaints and praises, and product-specific trends.
- Filter and search the review table; it initially shows ten rows and offers a “Load more” control.
- Generate suggested replies only when requested for a review marked as needing a reply.

## Architecture

```mermaid
flowchart LR
    Owner[Store owner] -->|Select CSV| UI[React dashboard]
    UI -->|Upload file| API[Express API]
    API --> Cleaner[CSV parser and cleaner]
    Cleaner -->|Import and review records| Atlas[(MongoDB Atlas)]
    UI -->|Start bulk analysis| API
    API --> Bulk[Bulk analysis service]
    Bulk <-->|Read and write analyses| Atlas
    Bulk -->|At most 5 concurrent calls| OpenRouter[OpenRouter API]
    OpenRouter -->|429, server error, or connection failure| Gemini[Gemini API fallback]
    OpenRouter -->|JSON response| Validator[Zod validation]
    Gemini -->|JSON response| Validator
    Validator -->|Validated analysis| Atlas
    UI -->|Fetch dashboard| API
    API -->|Metrics and review rows| UI
    UI -->|Click to draft a reply| API
    API --> OpenRouter
    OpenRouter -.-> Gemini
```

### Analysis flow

1. The browser uploads a CSV as multipart form data.
2. The backend validates its headers, cleans each row, and records a cleaning summary.
3. Accepted reviews and an import record are saved to Atlas.
4. The owner starts bulk analysis. The backend groups repeated text and checks both saved analyses and the shared cache.
5. Cache misses are processed in waves of up to five unique reviews. Each review is sent as untrusted data to OpenRouter; on a rate limit, server error, or connection failure, the backend can retry the request through Gemini when configured.
6. The backend parses the response and validates its fields. Invalid structured output gets one correction attempt; a second invalid response is marked `analysis_failed`.
7. Valid results are saved to the review and shared analysis cache. The dashboard fetches updated metrics and review rows.
8. A suggested reply is generated only after the owner clicks the reply action.

Bulk analysis currently runs during the API request and returns after processing finishes. It is not backed by a background queue, Redis, or BullMQ.

## CSV format and data cleaning

The CSV must include these columns. Header matching is case-insensitive, surrounding whitespace is trimmed, and spaces in header names are converted to underscores.

```csv
review_id,product,rating,date,review_text
R001,Cotton Bedsheet Set,5,2026-10-02,"Soft fabric, good value."
R002,Wireless Earbuds X2,1,2026-10-03,"The left earbud stopped working after two days."
```

| Condition | Handling |
|---|---|
| Missing required header | Reject the file with a clear error |
| Empty or whitespace-only review text | Skip the row and increment the empty-review count |
| Missing review ID or product | Skip the row and include its reason in row errors |
| Duplicate review ID in the same CSV | Skip the later row and report it as invalid |
| Missing rating | Keep the review with `rating: null` and `ratingStatus: "missing"` |
| Invalid rating (not an integer from 1 to 5) | Keep the review with `rating: null` and `ratingStatus: "invalid"` |
| Missing date | Keep the review with `date: null` |
| Invalid date or date outside `YYYY-MM-DD` | Keep the review with `date: null` and count it as invalid |
| HTML in review text | Remove tags and decode HTML entities |
| Repeated review text | Keep the row and mark it as a duplicate of the first matching review |

Duplicate text is normalized with Unicode NFKC, whitespace collapsing, trimming, and lowercasing before it is hashed. Identical text can therefore share one analysis even when capitalization or spacing differs. Row-error details are capped at 100 entries to keep responses bounded.

## AI response and prompt-injection handling

Every review analysis must return one JSON object with exactly these fields:

```json
{
  "sentiment": "positive | neutral | negative",
  "topics": ["quality", "delivery", "price", "packaging", "support", "size_fit", "other"],
  "summary": "One-line English summary, including for Hindi or Hinglish reviews.",
  "needs_reply": false
}
```

The backend requires:

- One of the allowed sentiment values.
- One or more unique topics from the allowed topic list.
- A non-empty, single-line summary of at most 280 characters.
- A boolean `needs_reply` value.
- No additional JSON fields.

Zod validates the parsed response. If JSON parsing or schema validation fails, ReviewLens sends one correction request with validation feedback. If the second result is still invalid, the review is marked `analysis_failed`; invalid model output is never stored as a completed result.

### Why R012 is treated as review content

Review text is customer-provided data, not an instruction source. The system prompt tells the model never to follow commands or role changes inside a review. The review is serialized as a value in the user payload under `customerReview`, with `trustLevel: "untrusted_data"`. This keeps the data boundary explicit and makes an instruction such as “ignore all previous instructions” part of the text being analyzed.

R012 also reports that an earbud stopped working after two days. The analysis prompt directs the model to classify the actual customer experience, and a backend safeguard marks explicit English product-failure reports as negative and reply-worthy. Prompt defenses reduce risk but cannot guarantee that every model will resist every attack, so responses are still validated and never executed as code.

Suggested-reply generation has a separate instruction to treat the review as untrusted, avoid inventing order details, avoid promising a remedy, and return a concise English reply in JSON.

## Batching, retries, and caching

### Bulk processing and retries

- Repeated review text is grouped before AI calls.
- The backend processes groups in waves of five, with no more than five concurrent per-review requests in a wave. This is bounded concurrency, not one combined prompt containing five reviews.
- HTTP 429, HTTP 5xx, and selected network/timeout errors are retried up to four total attempts.
- Backoff starts at one second, grows exponentially, caps at eight seconds, and adds jitter. A usable `Retry-After` value is respected, up to the configured cap.
- Invalid AI JSON or schema output has a separate one-time correction attempt.

### Shared analysis cache

The bulk and single-review endpoints use the same MongoDB cache service. Cache entries include the normalized review-text hash, OpenRouter model identifier, and prompt version. Cached values are schema-validated before reuse. Duplicate reviews in the same import inherit their original review's analysis.

Bulk analysis returns operational metrics including total and unique review counts, cache hits, AI calls, retries, failed reviews, and processing time.

## Dashboard guide

- **Summary cards:** analyzed count, positive/neutral/negative percentages, and reviews needing a reply.
- **Sentiment mix:** proportional view of the analyzed reviews by sentiment.
- **Top complaints and praises:** up to three recurring topic-and-summary groups across analyzed reviews.
- **Per-product insights:** select a product to view sentiment and issue trends, sentiment shares, and reply-needed information for that product.
- **Rating agreement:** compares the star rating with the model sentiment. Ratings of 1–2 map to negative, 3 to neutral, and 4–5 to positive. Unrated and unanalyzed reviews are excluded from agreement calculations.
- **Review explorer:** search by review ID, product, or text; filter by product, sentiment, topic, and reply-needed status; reveal more rows in increments of ten.
- **Suggested replies:** generate on click for analyzed reviews marked `needs_reply`; copy the returned draft from the table.

Top complaints and praises group identical topic-and-summary text. Similar meanings phrased differently may appear as separate groups.

## MongoDB Atlas and Compass setup

ReviewLens connects to Atlas using `MONGODB_URI`. Docker Compose is not part of the current setup.

1. In MongoDB Atlas, create a cluster if you do not already have one.
2. Create a database user with a strong password.
3. Add your development machine's IP address under **Network Access**.
4. Choose **Connect → Drivers**, copy the Node.js connection string, and replace its username, password, and cluster host.
5. Set the connection string as `MONGODB_URI` in `backend/.env`. Use the `ReviewLens` database name and URL-encode reserved characters in the password.
6. To browse the cluster in MongoDB Compass, choose **New Connection**, paste the connection string from Atlas's **Connect → Compass** option, replace its password placeholder, and connect. Compass uses the same Atlas database user and network access rules.

Example format (replace every placeholder; do not commit credentials):

```env
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster-host>/ReviewLens?retryWrites=true&w=majority
```

Compass is a separate desktop client. It is not a project dependency and does not need to run for the website or API to work.

## AI provider configuration

Create or copy the backend environment file:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Set these backend-only variables in `backend/.env`:

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Secret key used by the server to authorize OpenRouter requests |
| `OPENROUTER_MODEL` | Primary model ID, for example `nvidia/nemotron-3.5-super-vl:free` |
| `OPENROUTER_FALLBACK_MODEL` | Optional fallback model. If the primary model is individually rate-limited, ReviewLens tries `google/gemma-4-26b-a4b-it:free` once. |
| `OPENROUTER_BASE_URL` | Optional API base URL; defaults to `https://openrouter.ai/api/v1` |
| `OPENROUTER_SITE_URL` | Optional site URL sent as OpenRouter attribution metadata |
| `OPENROUTER_APP_NAME` | Optional app title sent as OpenRouter attribution metadata |
| `GEMINI_API_KEY` | Optional independent Gemini API key; enables cross-provider fallback |
| `GEMINI_MODEL` | Gemini fallback model; defaults to `gemini-3.5-flash-lite` |
| `GEMINI_BASE_URL` | Optional Gemini API base URL; defaults to `https://generativelanguage.googleapis.com/v1beta` |

Keep both keys in `backend/.env` only. Do not use a `VITE_` variable for either key and do not commit `.env` files. When Gemini is configured, OpenRouter account quota exhaustion can fail over to a different provider account. If Gemini is not configured or its own quota is exhausted, the dashboard reports a partial analysis and preserves completed results. Gemini free-tier availability and quotas depend on the Google AI Studio project and can change; verify the active limits in AI Studio before an evaluation. Free-tier requests may be used to improve Google's products, so do not submit sensitive customer data without reviewing Google's current data terms.

The frontend environment is only for the backend URL. Create it if needed:

```powershell
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

`VITE_API_BASE_URL` defaults to `http://localhost:5000/api`. It can be changed for a different backend host, but it must never contain either AI provider key.

## Run locally

Use a separate terminal for each process. Configure Atlas and OpenRouter first; add `GEMINI_API_KEY` to enable cross-provider fallback.

### Backend

```powershell
cd backend
npm ci
npm run dev
```

The API connects to Atlas before listening on port `5000` by default. To run without Nodemon:

```powershell
npm start
```

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The frontend calls the Express API; the browser does not contact OpenRouter or Gemini directly.

## API reference

All review endpoints are mounted under `/api/reviews`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Basic API health response |
| `POST` | `/api/reviews/upload` | Upload and clean a CSV. Send multipart form data using the field name `file`. |
| `POST` | `/api/reviews/bulk-analyze/:importId` | Analyze an import synchronously and return processing metrics. |
| `GET` | `/api/reviews/:importId/dashboard` | Return summary counts, top complaints/praises, and review rows. |
| `POST` | `/api/reviews/:importId/:reviewId/analyze` | Analyze one review, restore a cached result, or apply an original's result to a duplicate. |
| `POST` | `/api/reviews/:importId/:reviewId/suggest-reply` | Generate a suggested reply for an analyzed review with `needs_reply: true`. |

CSV upload is restricted to `.csv` files and a maximum size of 5 MB. The API returns a client error for invalid file or CSV input, and a bulk-analysis response includes its processing metrics.

## Tests and useful commands

Backend tests use Node's built-in test runner; no test framework dependency is required.

```powershell
cd backend
npm test
```

The current suite contains nine tests covering:

1. CSV cleanup, empty review skipping, missing/invalid ratings, and invalid dates.
2. Duplicate review-text detection, required headers, and row handling.
3. Accepted and rejected AI schema examples, including unknown fields and duplicate topics.
4. Retry behavior for rate limits, non-retryable errors, and exhausted attempts.

| Directory | Command | Purpose |
|---|---|---|
| `backend` | `npm run dev` | Start the API with Nodemon |
| `backend` | `npm start` | Start the API without Nodemon |
| `backend` | `npm test` | Run backend unit tests |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Build frontend assets for production |
| `frontend` | `npm run lint` | Run ESLint |

The unit tests do not make live OpenRouter calls or verify a deployed upload-to-dashboard flow.

## Project structure

```text
ReviewLens/
├── backend/
│   ├── src/
│   │   ├── config/          # Atlas and OpenRouter configuration
│   │   ├── controllers/     # Upload, dashboard, single and bulk analysis routes
│   │   ├── middlewares/     # CSV upload handling and size/type limits
│   │   ├── models/          # Import, review, and analysis-cache schemas
│   │   ├── services/        # CSV cleaning, analysis, prompts, cache, provider
│   │   ├── utils/           # Hashing and retry/backoff helpers
│   │   └── validators/      # Strict AI response schema
│   ├── test/                # Node test-runner suites
│   └── .env.example         # Safe backend configuration template
├── frontend/
│   └── src/
│       ├── components/      # Upload, insight, product, and review UI
│       ├── services/        # Calls to the backend API
│       └── utils/           # Rating/sentiment agreement helpers
└── README.md
```

## Assessment checklist and project status

This checklist describes implemented code, not proof that a complete deployment or live model call has been verified.

### Core requirements

- [x] Upload CSV data, clean malformed rows, skip empty reviews, preserve unknown ratings, and detect duplicates.
- [x] Analyze reviews with structured sentiment, topic, summary, and reply-needed fields.
- [x] Validate every analysis response and allow one correction attempt before marking it failed.
- [x] Treat review content as untrusted input and document R012 handling.
- [x] Process bounded groups and retry transient provider failures with backoff.
- [x] Reuse validated MongoDB cache entries across bulk and single-review paths.
- [x] Provide summary cards, product-specific insights, top complaints/praises, filters, and on-click replies.
- [x] Keep AI provider API keys in the backend environment.

### Submission work still to verify or complete

- [ ] Run a full live flow with a representative CSV and confirm upload → analysis → dashboard.
- [x] Add screenshots captured from the running app.
- [ ] Confirm the repository is public and submit the repository link and ZIP if required.
- [ ] Review commit history for distinct, meaningful changes.

## Limitations and next steps

- Bulk analysis runs synchronously; very large imports may take a long time or exceed HTTP timeouts. Progress reporting or a job queue could be added if needed.
- The current complaint/praise grouping is based on identical topic-and-summary text, not semantic similarity.
- The test suite covers core backend utilities and schemas, but not MongoDB integration, live OpenRouter calls, or browser end-to-end behavior.
- Free model availability, quota, latency, and data-use terms are provider-specific and may change. Verify them before processing a large dataset or real customer information.
- Validate prompt-injection behavior, English/Hindi/Hinglish quality, sarcasm, and model output against representative reviews before deployment.

## AI coding tools

Codex assisted with code inspection, implementation, documentation, and test creation. The project owner should review the changes and be ready to explain and maintain the submitted code. Add any other tools used during development and describe their role accurately.

## Screenshots

The screenshots below show the dashboard after importing and analyzing review data.

### Upload and dashboard overview

![ReviewLens upload flow, data-cleaning report, and sentiment summary](docs/screenshots/upload-and-dashboard-overview.png)

### Sentiment mix, complaints, and praises

![Sentiment distribution with the top complaint and praise themes](docs/screenshots/sentiment-and-themes.png)

### Product insights and review explorer

![Product-level sentiment trend, themes, and review filters](docs/screenshots/product-insights-and-review-explorer.png)

### Review analysis and suggested replies

![Review analysis with generated suggested replies for reviews that need a response](docs/screenshots/review-analysis-and-suggested-replies.png)
