import "./Salary.css";

const money = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? `$${Math.round(Number(value) / 1000)}k USD` : "-";

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
  const salaryBands = data.salary_bands || [];
  const largestBand = Math.max(...salaryBands.map((band) => Number(band.count) || 0), 1);
  const payTypeTotal = Number(data.yearly_count || 0) + Number(data.hourly_count || 0);
  const coverageByRole = data.coverage_by_role || [];

  return <main className="salary-page">
    <header className="salary-header"><h1>Salaries</h1><p>Compensation benchmarks from salary information disclosed in tracked postings. All monetary values are in USD.</p></header>
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
    <section className="salary-insights" aria-label="Salary insights">
      <article className="salary-insight-card"><Heading title="Listed salary bands" caption="Annualized USD role midpoints with disclosed pay" />
        {cachedData === undefined ? <div className="salary-insight-state">Loading salary distribution...</div> : salaryBands.length ? <div className="salary-band-list">{salaryBands.map((band) => <div className="salary-band" key={band.label}><span>{`${band.label} USD`}</span><i><b style={{ width: `${(Number(band.count) / largestBand) * 100}%` }} /></i><strong>{Number(band.count).toLocaleString()}</strong></div>)}</div> : <div className="salary-insight-state">No annual salary data is available yet.</div>}
      </article>
      <article className="salary-insight-card"><Heading title="Pay type mix" caption="Disclosed compensation records" />
        {cachedData === undefined ? <div className="salary-insight-state">Loading pay types...</div> : payTypeTotal ? <div className="salary-type-content"><div className="salary-type-bar"><i style={{ width: `${salaryMix}%` }} /></div><div className="salary-type-labels"><span><b>{salaryMix.toFixed(0)}%</b> Yearly</span><span><b>{(100 - salaryMix).toFixed(0)}%</b> Hourly</span></div><div className="salary-type-records"><span>{Number(data.yearly_count || 0).toLocaleString()} yearly records</span><span>{Number(data.hourly_count || 0).toLocaleString()} hourly records</span></div><small>{payTypeTotal.toLocaleString()} records include a pay type</small></div> : <div className="salary-insight-state">No pay-type data is available yet.</div>}
      </article>
      <article className="salary-insight-card salary-role-coverage"><Heading title="Best-covered role categories" caption="Share of postings with disclosed compensation" />
        {cachedData === undefined ? <div className="salary-insight-state">Loading coverage...</div> : coverageByRole.length ? <div className="salary-coverage-wrap"><table className="salary-coverage-table"><thead><tr><th>Role category</th><th>Disclosed</th><th>Coverage</th></tr></thead><tbody>{coverageByRole.map((role) => { const roleCoverage = role.posting_count ? (Number(role.disclosed_count) / Number(role.posting_count)) * 100 : 0; return <tr key={role.role}><td>{role.role}</td><td>{Number(role.disclosed_count).toLocaleString()}</td><td>{roleCoverage.toFixed(0)}%</td></tr>; })}</tbody></table></div> : <div className="salary-insight-state">No role coverage data is available yet.</div>}
      </article>
    </section>
  </main>;
}

function Summary({ label, value, note, accent = false }) { return <article><span>{label}</span><div><strong className={accent ? "accent" : ""}>{value}</strong><small>{note}</small></div></article>; }
function Heading({ title, caption }) { return <div className="salary-section-heading"><h2>{title}</h2><p>{caption}</p></div>; }

export default Salary;
