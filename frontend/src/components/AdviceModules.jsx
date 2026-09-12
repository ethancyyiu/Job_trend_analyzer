export function PageHero({
  eyebrow,
  title,
  description,
  decision,
  decisionDetail,
}) {
  const revealDetails = () => {
    document.getElementById("page-details")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="page-hero">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <aside className="hero-decision">
        <span>Today’s recommendation</span>
        <strong>{decision}</strong>
        <p>{decisionDetail}</p>
      </aside>
      <button className="hero-continue" type="button" onClick={revealDetails}>
        <span>See your next actions</span>
        <span className="hero-continue-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="m3 6 5 5 5-5" />
          </svg>
        </span>
      </button>
    </section>
  );
}

export function AdviceRow({
  meaning,
  actions,
  onAction,
  actionLabel = "Take the next step",
}) {
  return (
    <section className="advice-grid" id="page-details">
      <article className="advice-card">
        <div className="module-kicker">What this means</div>
        <h2>{meaning.title}</h2>
        <p>{meaning.body}</p>
      </article>
      <aside className="action-card">
        <div className="module-kicker">What you should do next</div>
        <h2>{actions.title}</h2>
        <ul className="action-list">
          {actions.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {onAction && (
          <button className="primary-btn" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </aside>
    </section>
  );
}
