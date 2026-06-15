export function TimeToggle({ period, setPeriod }) {
  const options = [
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "90 days", value: "90d" },
    { label: "All Time", value: "All Time" },
  ];

  return (
    <select
      className="time-toggle"
      value={period}
      onChange={(e) => setPeriod(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
