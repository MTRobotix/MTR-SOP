// Shown the moment a link is clicked, while the next page's data loads (and prefetched with every link),
// so navigation never waits on the server before the screen changes.
export default function Loading() {
  return (
    <div className="shell page skeleton-stack" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading…
      </p>
      <span className="skeleton skeleton-title" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-block" />
    </div>
  );
}
