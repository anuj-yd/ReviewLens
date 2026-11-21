export function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl border border-[#ff8a4c]/30 bg-[#ff8a4c]/10 text-[#ff8a4c] shadow-xs ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M4.5 17.5V7.2c0-.9.7-1.7 1.6-1.7h11.8c.9 0 1.6.8 1.6 1.7v10.3c0 .9-.7 1.7-1.6 1.7H6.1c-.9 0-1.6-.8-1.6-1.7Z" stroke="currentColor" strokeWidth="1.6"/>
        <path d="m8 14 2.5-2.5 2 2 3.5-4M8 16.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

export function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    upload: <><path d="M12 15V4m0 0L8 8m4-4 4 4M5 15v3.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V15" /></>,
    arrow: <path d="M4 10h12m-5-5 5 5-5 5" />,
    check: <path d="m4.5 10.2 3.4 3.4 7.6-7.4" />,
    spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 12 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></>,
    review: <><path d="M4 5.8c0-1 .8-1.8 1.8-1.8h12.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8h-7l-4.5 4v-4.1c-1.5-.1-2.7-.9-2.7-2.4V5.8Z"/><path d="M8 8h8M8 12h5"/></>,
    reply: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v4" />,
    positive: <path d="m5 14 5-5 4 4 5-7m-5 0h5v5" />,
    neutral: <path d="M5 12h14" />,
    negative: <path d="m5 10 5 5 4-4 5 7m-5 0h5v-5" />,
    chart: <><path d="M4 19V5m0 14h16"/><path d="m6 15 4-4 3 2 5-6"/></>,
    warning: <><path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2-2.4 3.8M12 17h.01"/></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    filter: <path d="M3 5h18M6 12h12M10 19h4" />
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {paths[name] || paths.chart}
      </g>
    </svg>
  )
}

export function Spinner({ className = 'h-3.5 w-3.5' }) {
  return (
    <span className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden="true" />
  )
}

export function BentoCard({ children, className = '', header, title, badge, action }) {
  return (
    <div className={`bento-card relative flex flex-col justify-between overflow-hidden p-5 sm:p-6 ${className}`}>
      {(header || title || badge || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {header && <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#71717a]">{header}</p>}
            {title && <h3 className="mt-0.5 text-base font-semibold tracking-tight text-[#f5f5f4]">{title}</h3>}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

export function BentoSectionHeader({ eyebrow, title, detail, action }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">{eyebrow}</p>
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f4]">{title}</h2>
          {detail && <span className="font-mono text-xs text-[#71717a]">· {detail}</span>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, detail }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a4c]" />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff8a4c]">{eyebrow}</p>
      </div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f4]">{title}</h2>
        {detail && <p className="font-mono text-xs text-[#71717a]">· {detail}</p>}
      </div>
    </div>
  )
}

export function StatCard({ title, value, detail, icon, accent = 'blue', tooltip }) {
  const accents = {
    blue: {
      box: 'border-white/[0.08] bg-white/[0.03] text-[#a1a1aa]',
      glow: 'hover:border-blue-500/30'
    },
    emerald: {
      box: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300',
      glow: 'hover:border-emerald-400/30'
    },
    amber: {
      box: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200',
      glow: 'hover:border-amber-400/30'
    },
    rose: {
      box: 'border-rose-400/20 bg-rose-400/[0.06] text-rose-300',
      glow: 'hover:border-rose-400/30'
    }
  }

  const selectedAccent = accents[accent] || accents.blue

  return (
    <div
      title={tooltip || title}
      className={`bento-subcard relative flex flex-col justify-between p-4 transition-all duration-150 ${selectedAccent.glow}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#a1a1aa]">{title}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${selectedAccent.box}`}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3">
        <p className="font-serif text-3xl italic leading-none tracking-tight tabular-nums text-[#f5f5f4]">{value}</p>
        {detail && <p className="mt-1.5 font-mono text-[11px] text-[#71717a]">{detail}</p>}
      </div>
    </div>
  )
}

export function SentimentBadge({ sentiment }) {
  const styles = sentiment === 'positive'
    ? { border: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300', dot: 'bg-emerald-400' }
    : sentiment === 'negative'
      ? { border: 'border-rose-400/20 bg-rose-400/[0.08] text-rose-300', dot: 'bg-rose-400' }
      : { border: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-200', dot: 'bg-amber-300' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-medium capitalize ${styles.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {sentiment}
    </span>
  )
}

export function Rating({ rating }) {
  if (rating == null) {
    return (
      <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-[#71717a]">
        Unrated
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-amber-400" aria-label={`${rating} out of 5 stars`}>
        {'★'.repeat(rating)}<span className="text-zinc-700">{'★'.repeat(5 - rating)}</span>
      </span>
      <span className="font-mono text-[11px] text-[#a1a1aa]">{rating}/5</span>
    </span>
  )
}

export function AnalysisStatus({ status }) {
  const failed = status === 'analysis_failed'
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${failed ? 'text-rose-300' : 'text-[#71717a]'}`}>
      <i className={`h-1.5 w-1.5 rounded-full ${failed ? 'bg-rose-400' : 'bg-zinc-600'}`} />
      {failed ? 'Analysis failed' : 'Not analyzed'}
    </span>
  )
}
