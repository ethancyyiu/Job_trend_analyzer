import { AdviceRow, PageHero } from "../components/AdviceModules";

export function Postings({ cachedData }) {
  const postings = cachedData?.postings || [];
  const companies = new Set(postings.map((row) => row.company).filter(Boolean)).size;
  const freshTitle = postings[0]?.title || "a fresh role";
  return (
    <main className="page-shell">
      <PageHero
        eyebrow="Job postings"
        title="Roles worth a closer look."
        description="Use this list to find jobs that fit, then decide which ones are worth tailoring an application for."
        decision={`Take a look at ${freshTitle}.`}
        decisionDetail="It is one of the newer roles in your market."
      />
      <AdviceRow
        meaning={{
          title: "Freshness is an advantage.",
          body: `You have ${postings.length} recent roles across ${companies} employers to assess. Prioritize a small number of relevant, newly posted opportunities over broad, generic applications.`,
        }}
        actions={{
          title: "Your application sprint",
          items: [
            "Choose three roles where you meet most of the core requirements.",
            "Tailor the first third of your resume to each role.",
            "Apply within 48 hours, then save a follow-up reminder.",
          ],
        }}
      />
      <section className="metric-grid">
        <div className="metric-card">
          <span>Ready to review</span>
          <strong>{postings.length}</strong>
          <p>Most recent opportunities</p>
        </div>
        <div className="metric-card">
          <span>Employers hiring</span>
          <strong>{companies}</strong>
          <p>Distinct companies in this set</p>
        </div>
        <div className="metric-card">
          <span>Market depth</span>
          <strong>{cachedData?.total_postings ?? "—"}</strong>
          <p>Total postings collected</p>
        </div>
      </section>
      <section className="data-card">
        <div className="chart-card-header">
          <div>
            <div className="module-kicker">Your action queue</div>
            <h2>Recent roles to assess</h2>
            <p>
              Open each role with a specific story you can tell about your fit.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="postings-table">
            <thead>
              <tr>
                <th className="postings-title">Role to target</th>
                <th className="postings-employer">Employer</th>
                <th className="postings-location">Location</th>
                <th className="postings-date">Posted</th>
                <th className="postings-link">Posting</th>
              </tr>
            </thead>
            <tbody>
              {postings.map((row, i) => (
                <tr key={`${row.title}-${i}`}>
                  <td className="postings-title">
                    <div className="job-title">{row.title}</div>
                  </td>
                  <td className="postings-employer">{row.company}</td>
                  <td className="postings-location">{row.location}</td>
                  <td className="postings-date">
                    {row.date_posted || row.date || "Recent"}
                  </td>
                  <td className="postings-link">
                    {row.posting_url ? (
                      <a href={row.posting_url} target="_blank" rel="noreferrer">
                        View role
                      </a>
                    ) : (
                      "Unavailable"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
