export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading scene">
      <div className="page-loader__sprite" aria-hidden="true" />
      <audio className="hidden-audio" src="/tvchannels/tvSound.mp3" autoPlay loop preload="auto" />
    </div>
  )
}
