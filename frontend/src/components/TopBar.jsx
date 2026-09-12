export default function TopBar({ page, onMenuClick }) {
  const name =
    page === "SkillsView" ? "Skills" : page.replace(/([A-Z])/g, " $1").trim();
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
          <div className="topbar-page">Your career strategy / {name}</div>
        </div>
        <div className="topbar-sync">Market signals refresh daily</div>
      </div>
    </div>
  );
}
