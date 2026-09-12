export default function Nav({ page, setPage }) {
  const items = [
    { key: "DailyTrends", label: "Market outlook" },
    { key: "ResumeAnalyzer", label: "My next move" },
    { key: "SkillsView", label: "Skills to build" },
    { key: "Postings", label: "Roles to target" },
    { key: "Salary", label: "Pay guidance" },
  ];

  return (
    <div className="nav-vertical">
      {items.map((item) => (
        <button
          key={item.key}
          className={"nav-item " + (page === item.key ? "active" : "")}
          onClick={() => setPage(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
