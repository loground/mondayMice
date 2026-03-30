export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading scene">
      <div className="page-loader__spinner" />
      <p className="page-loader__label">Loading scene...</p>
    </div>
  )
}
