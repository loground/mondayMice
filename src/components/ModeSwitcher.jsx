export function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Display mode switcher">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'regular'}
        className={`mode-btn ${mode === 'regular' ? 'is-active' : ''}`}
        onClick={() => onChange('regular')}
      >
        Regular
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'spotlight'}
        className={`mode-btn ${mode === 'spotlight' ? 'is-active' : ''}`}
        onClick={() => onChange('spotlight')}
      >
        Spotlight
      </button>
    </div>
  )
}
