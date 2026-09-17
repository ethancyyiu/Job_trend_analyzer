function formatLastScrapedAt(value) {
  if (!value) return "Loading last scrape...";

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "Last scrape unavailable";

  return `Last scrape: ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)}`;
}

export default function TopBar({ page, lastScrapedAt, onMenuClick }) {
  const name =
    page === "SkillsView" ? "Skills" : page === "Overview" ? "Overview" : page.replace(/([A-Z])/g, " $1").trim();
  return (
    <div className="topbar-root">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button
            className="menu-btn"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div className="topbar-page">{name}</div>
        </div>
        <div className="topbar-sync" title="Time the most recent scraper run completed">
          {formatLastScrapedAt(lastScrapedAt)}
        </div>
      </div>
    </div>
  );
}
