import "./Salary.css";

const money = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? `$${Math.round(Number(value) / 1000)}k` : "-";

export function Salary({ cachedData }) {
  const data = cachedData || {};
  const ranges = (data.each_category_median || []).map((item) => ({
    title: item.title || "Uncategorized",
    min: Number(item.median_minimum) || 0,
    max: Number(item.median_maximum) || 0,
  })).filter((item) => item.min || item.max).sort((a, b) => b.max - a.max);
  const maximum = Math.max(...ranges.map((item) => item.max), Number(data.median_max) || 1);
  const coverage = Number(data.coverage_percentage) || 0;
  const salaryMix = Number(data.yearly_percentage) || 0;

  return <main className="salary-page">
    <header className="salary-header"><h1>Salaries</h1><p>Compensation benchmarks from salary information disclosed in tracked postings.</p></header>
    <section className="salary-summary" aria-label="Salary summary">
      <Summary label="Median listed range" value={`${money(data.median_min)} - ${money(data.median_max)}`} note="across postings with salary data" />
      <Summary label="Salary visibility" value={`${coverage.toFixed(0)}%`} note={`${Number(data.coverage_count || 0).toLocaleString()} postings disclose pay`} />
      <Summary label="Salaried roles" value={`${salaryMix.toFixed(0)}%`} note="of postings with pay type data" accent />
    </section>
    <section className="salary-ranges">
      <Heading title="Salary distribution by role" caption="Median listed minimum and maximum salary by role category" />
      {cachedData === undefined ? <div className="salary-state">Loading salary data...</div> : ranges.length ? <div className="salary-range-list">{ranges.map((item) => <div className="salary-range" key={item.title}><div className="salary-range-label"><strong>{item.title}</strong><span>{money(item.min)} - {money(item.max)}</span></div><div className="salary-track"><i style={{ left: `${(item.min / maximum) * 100}%`, width: `${((item.max - item.min) / maximum) * 100}%` }} /><b style={{ left: `${(((item.min + item.max) / 2) / maximum) * 100}%` }} /></div><div className="salary-values"><span>{money(item.min)}</span><strong>{money((item.min + item.max) / 2)}</strong><span>{money(item.max)}</span></div></div>)}</div> : <div className="salary-state">No salary ranges are available yet.</div>}
      <div className="salary-legend"><span><i /> Listed range</span><span><b /> Midpoint</span></div>
    </section>
  </main>;
}

function Summary({ label, value, note, accent = false }) { return <article><span>{label}</span><div><strong className={accent ? "accent" : ""}>{value}</strong><small>{note}</small></div></article>; }
function Heading({ title, caption }) { return <div className="salary-section-heading"><h2>{title}</h2><p>{caption}</p></div>; }

export default Salary;
