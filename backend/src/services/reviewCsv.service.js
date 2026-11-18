import { parse } from 'csv-parse/sync'

import { createHash } from 'node:crypto'
import sanitizeHtml from 'sanitize-html'
import { decode } from 'he'

const REQUIRED_HEADERS = [
  'review_id',
  'product',
  'rating',
  'date',
  'review_text'
]

// Normalize CSV column names
const normalizeHeader = (header) => {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

// Remove HTML and decode HTML entities
const cleanReviewText = (value) => {
  const sanitized = sanitizeHtml(String(value ?? ''), {
    allowedTags: [],
    allowedAttributes: {}
  })

  return decode(sanitized).trim()
}

// Generate normalized text for hashing
const normalizeTextForHash = (text) => {
  return text
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Generate SHA-256 hash
const generateTextHash = (text) => {
  const normalized = normalizeTextForHash(text)

  return createHash('sha256')
    .update(normalized)
    .digest('hex')
}

// Validate rating
const parseRating = (value) => {
  const raw = String(value ?? '').trim()

  if (!raw) {
    return {
      rating: null,
      ratingStatus: 'missing'
    }
  }

  const rating = Number(raw)

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return {
      rating: null,
      ratingStatus: 'invalid'
    }
  }

  return {
    rating,
    ratingStatus: 'valid'
  }
}

// Validate date in YYYY-MM-DD format
const parseReviewDate = (value) => {
  const raw = String(value ?? '').trim()

  if (!raw) {
    return {
      date: null,
      invalid: false
    }
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return {
      date: null,
      invalid: true
    }
  }

  const [, year, month, day] = match

  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  )

  const isValid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)

  return {
    date: isValid ? date : null,
    invalid: !isValid
  }
}

// Main CSV cleaning function
export const parseAndCleanReviews = (buffer) => {

  const rows = parse(buffer, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: false
  })

  if (!rows.length) {
    throw new Error('CSV file is empty.')
  }

  const headers = rows[0].map(normalizeHeader)

  const duplicatesInHeader = headers.some(
    (header, index) => headers.indexOf(header) !== index
  )

  if (duplicatesInHeader) {
    throw new Error('CSV contains duplicate column names.')
  }

  const missingHeaders = REQUIRED_HEADERS.filter(
    header => !headers.includes(header)
  )

  if (missingHeaders.length) {
    throw new Error(
      `Missing required columns: ${missingHeaders.join(', ')}`
    )
  }

  const dataRows = rows.slice(1)

  const reviews = []
  const rowErrors = []

  const seenHashes = new Map()
  const seenReviewIds = new Set()

  const summary = {
    totalRows: dataRows.length,
    acceptedReviewRows: 0,
    uniqueReviewCount: 0,
    skippedEmptyReviews: 0,
    skippedInvalidRows: 0,
    duplicateCount: 0,
    missingRatingCount: 0,
    invalidRatingCount: 0,
    invalidDateCount: 0
  }

  dataRows.forEach((record, index) => {

    // Build a row object using CSV headers
    const values = [...record]

    // Recover extra unquoted commas in the final review_text column
    if (values.length > headers.length) {
      values[headers.length - 1] = values
        .slice(headers.length - 1)
        .join(',')

      values.length = headers.length
    }

    const row = Object.fromEntries(
      headers.map((header, i) => [
        header,
        values[i] ?? ''
      ])
    )

    const recordNumber = index + 2

    const reviewId = String(row.review_id ?? '').trim()
    const product = String(row.product ?? '').trim()

    const reviewText = cleanReviewText(row.review_text)

    // Empty review
    if (!reviewText) {
      summary.skippedEmptyReviews++
      return
    }

    // Required fields
    if (!reviewId || !product) {
      summary.skippedInvalidRows++

      if (rowErrors.length < 100) {
        rowErrors.push({
          recordNumber,
          reviewId,
          reason: 'Missing review ID or product name'
        })
      }

      return
    }

    // Duplicate review ID
    if (seenReviewIds.has(reviewId)) {
      summary.skippedInvalidRows++

      if (rowErrors.length < 100) {
        rowErrors.push({
          recordNumber,
          reviewId,
          reason: 'Duplicate review ID'
        })
      }

      return
    }

    seenReviewIds.add(reviewId)

    // Rating validation
    const ratingResult = parseRating(row.rating)

    if (ratingResult.ratingStatus === 'missing') {
      summary.missingRatingCount++
    }

    if (ratingResult.ratingStatus === 'invalid') {
      summary.invalidRatingCount++
    }

    // Date validation
    const dateResult = parseReviewDate(row.date)

    if (dateResult.invalid) {
      summary.invalidDateCount++
    }

    // Text hash
    const textHash = generateTextHash(reviewText)

    // Duplicate content detection
    const duplicateOf = seenHashes.get(textHash) ?? null

    const isDuplicate = Boolean(duplicateOf)

    if (isDuplicate) {
      summary.duplicateCount++
    } else {
      seenHashes.set(textHash, reviewId)
      summary.uniqueReviewCount++
    }

    reviews.push({
      reviewId,
      product,

      rating: ratingResult.rating,
      ratingStatus: ratingResult.ratingStatus,

      date: dateResult.date,

      reviewText,
      textHash,

      isDuplicate,
      duplicateOf,

      analysisStatus: 'pending'
    })

    summary.acceptedReviewRows++
  })

  return {
    reviews,
    summary,
    rowErrors
  }
}
