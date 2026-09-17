export default function Nav({ page, setPage }) {
  const items = [
    { key: "Overview", label: "Overview" },
    { key: "Postings", label: "Job Postings" },
    { key: "SkillsView", label: "Skills" },
    { key: "Salary", label: "Salaries" },
    { key: "DailyTrends", label: "Trends" },
    { key: "ResumeAnalyzer", label: "Career Advisor" },
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
