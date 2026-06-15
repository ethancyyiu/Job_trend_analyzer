export function TimeToggle({ period, setPeriod }) {
  const options = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "All time", value: "all" },
  ];

  return (
    <div className="toggle-row">
      {options.map(opt => (
        <button
          key={opt.value}
          className={period === opt.value ? "active" : ""}
          onClick={() => setPeriod(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
