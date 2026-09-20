function formatLastScrapedAt(value) {
  if (!value) return "Loading last scrape..."

  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return "Last scrape unavailable"

  return `Last scrape: ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)}`
}

export default function TopBar({ page, lastScrapedAt, onMenuClick, sidebarOpen }) {
  const name = page === "SkillsView"
    ? "Skills"
    : page === "Overview"
      ? "Overview"
      : page.replace(/([A-Z])/g, " $1").trim()

  return (
    <div className="topbar-root">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button
            className="menu-btn"
            onClick={onMenuClick}
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
          <div className="topbar-page">{name}</div>
        </div>
        <div className="topbar-sync" title="Time the most recent scraper run completed">
          {formatLastScrapedAt(lastScrapedAt)}
        </div>
      </div>
    </div>
  )
}
