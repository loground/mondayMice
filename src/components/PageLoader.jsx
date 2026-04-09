import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading scene">
      <div className="page-loader__animation" aria-hidden="true">
        <DotLottieReact src="/loading.lottie" autoplay loop />
      </div>
      <p className="page-loader__label">Loading scene...</p>
    </div>
  )
}
