export function MmicePage({ onBack }) {
  return (
    <main className="video-page" aria-label="MMICE FULL VIDEO 2025 page">
      <button type="button" className="video-page__back" onClick={onBack} aria-label="Back">
        <img src="/back.png" alt="" />
      </button>

      <section className="video-page__hero">
        <img src="/videos/mmice.webp" alt="MMICE FULL VIDEO 2025" />
      </section>

      <section className="video-page__player-wrap">
        <div className="video-page__player">
          <iframe
            src="https://www.youtube.com/embed/V69txbJx0rM?si=XB3Oco0spRILAvTD"
            title="MMICE FULL VIDEO 2025"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>
    </main>
  )
}
