import {BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer} from "recharts";
import { AdviceRow, PageHero } from "../components/AdviceModules";

const money = (value) => value ? `$${Math.round(Number(value) / 1000)}k` : "—";

function SalaryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-title">{d.title}</div>
      <div>{d.label}</div>
    </div>
  );
}
export function Salary({ cachedData }) {
  const data = cachedData || {};
  const categories = [
    "software engineer",
    "data engineer",
    "machine learning engineer",
    "data scientist",
    "data analyst",
    "others",
  ];
  const lookup = (data.each_category_median || []).reduce(
    (a, x) => ({ ...a, [x.title]: x }),
    {},);
  const ranges = categories.map((title) => {
    const x = lookup[title] || {};
    const min = Number(x.median_minimum) || 0,
      max = Number(x.median_maximum) || 0;
    return {
      title,
      min,
      range: Math.max(0, max - min),
      max,
      label: min && max ? `${money(min)} – ${money(max)}` : "Range unavailable",
    };
  });
  const max =
    Math.ceil(
      Math.max(...ranges.map((x) => x.max), Number(data.median_max) || 1) / 10000,) * 10000;
  const coverage = Math.round(data.coverage_percentage || 0);
  const median = `${money(data.median_min)} – ${money(data.median_max)}`;
  return (
    <main className="page-shell">
      <PageHero
        eyebrow="Salary"
        title="Get a sense of the pay range."
        description="Check listed salaries before you apply or talk numbers, and use them as one factor when comparing roles."
        decision={
          coverage
            ? `A useful reference point is ${median}.`
            : "Compare similar roles before naming a number."
        }
        decisionDetail="Start with similar roles, then factor in location and your experience."
      />
      <AdviceRow
        meaning={{
          title: "Ranges are useful when you turn them into an ask.",
          body: `Salary data is available for ${coverage}% of tracked postings. Treat the midpoint as context—not a ceiling—and prepare the value evidence that supports the upper part of your range.`,
        }}
        actions={{
          title: "Prepare your compensation case",
          items: [
            "Set a target, a stretch number, and a walk-away point.",
            "Compare only roles with similar scope and seniority.",
            "Connect your ask to outcomes, not years of experience alone.",
          ],
        }}
      />
      <section className="metric-grid">
        <div className="metric-card">
          <span>Salary visibility</span>
          <strong>{coverage}%</strong>
          <p>{data.coverage_count || 0} postings disclose pay</p>
        </div>
        <div className="metric-card">
          <span>Market range</span>
          <strong>{median}</strong>
          <p>Median disclosed annual range</p>
        </div>
        <div className="metric-card">
          <span>Compensation mix</span>
          <strong>{Math.round(data.yearly_percentage || 0)}%</strong>
          <p>Roles reported as salaried</p>
        </div>
      </section>
      <section className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="module-kicker">Negotiation context</div>
            <h2>Role ranges worth benchmarking</h2>
            <p>Compare the scope of roles before you compare the numbers.</p>
          </div>
        </div>
        <div className="salary-range-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ranges}
              layout="vertical"
              margin={{ left: 5, right: 25 }}
            >
              <CartesianGrid
                stroke="#dce5ef"
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, max]}
                tickFormatter={money}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="title"
                width={155}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<SalaryTooltip />} />
              <Bar dataKey="min" stackId="a" fill="transparent" />
              <Bar
                dataKey="range"
                stackId="a"
                fill="#06B6D4"
                radius={8}
                barSize={17}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
export default Salary;
