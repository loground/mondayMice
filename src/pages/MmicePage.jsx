export function MmicePage({ onBack }) {
  return (
    <>
      <button type="button" className="video-page__back" onClick={onBack} aria-label="Back">
        <img src="/pages/mmiceBack.png" alt="" />
      </button>

      <main className="video-page" aria-label="MMICE FULL VIDEO 2025 page">
      <section className="video-page__bg" aria-hidden="true">
        <img src="/pages/mmiceBg.png" alt="" />
      </section>

      <section className="video-page__content">
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

      <footer className="video-page__footer" aria-hidden="true">
        <img src="/images/footer.png" alt="" />
      </footer>
      </main>
    </>
  )
}
