const VIDEO_PAGES = {
  full: {
    label: 'MMICE FULL VIDEO 2025',
    embedUrl: 'https://www.youtube.com/embed/hcLpAVJ24u8',
    className: '',
  },
  magatour: {
    label: 'MAGAMAEV PROTOUR',
    embedUrl: 'https://www.youtube.com/embed/nS9rtbNpu3M',
    className: 'video-page--magatour',
  },
}

export function MmicePage({ onBack, variant = 'full' }) {
  const page = VIDEO_PAGES[variant] ?? VIDEO_PAGES.full

  return (
    <>
      <button type="button" className="video-page__back" onClick={onBack} aria-label="Back">
        <img src="/pages/mmiceBack.png" alt="" />
      </button>

      <main className={`video-page ${page.className}`} aria-label={`${page.label} page`}>
        {variant === 'magatour' ? (
          <>
            <img className="video-page__magatour-header" src="/pages/magatour_header.png" alt="" />
            <picture className="video-page__magatour-mice" aria-hidden="true">
              <source media="(max-width: 900px)" srcSet="/pages/mice_mob.png" />
              <img src="/pages/mice.png" alt="" />
            </picture>
          </>
        ) : (
          <section className="video-page__bg" aria-hidden="true">
            <picture>
              <source media="(max-width: 900px)" srcSet="/pages/mmiceBgMobile.png" />
              <img src="/pages/mmiceBg.png" alt="" />
            </picture>
          </section>
        )}

        <section className="video-page__content">
          <div className="video-page__player">
            <iframe
              src={page.embedUrl}
              title={page.label}
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
