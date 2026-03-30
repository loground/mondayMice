import { useEffect, useRef } from 'react'

export function useSpotlightEffect(config = {}) {
  const {
    spotlightSize = 300,
    spotlightIntensity = 1,
    fadeSpeed = 0.055,
    glowColor = '255, 255, 255',
    pulseSpeed = 3200,
  } = config

  const canvasRef = useRef(null)
  const spotlightPos = useRef({ x: 0, y: 0 })
  const targetPos = useRef({ x: 0, y: 0 })
  const animationFrame = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    const maskAlpha = isCoarsePointer ? 0.45 : 0.76
    const liveSpotlightSize = isCoarsePointer ? spotlightSize * 1.35 : spotlightSize

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const lerp = (start, end, factor) => start + (end - start) * factor

    const handleMouseMove = (event) => {
      targetPos.current = { x: event.clientX, y: event.clientY }
      const nx = event.clientX / window.innerWidth
      const ny = event.clientY / window.innerHeight
      document.documentElement.style.setProperty('--mx', String(nx))
      document.documentElement.style.setProperty('--my', String(ny))
    }

    const handleTouchMove = (event) => {
      const touch = event.touches[0]
      if (!touch) return
      targetPos.current = { x: touch.clientX, y: touch.clientY }
      const nx = touch.clientX / window.innerWidth
      const ny = touch.clientY / window.innerHeight
      document.documentElement.style.setProperty('--mx', String(nx))
      document.documentElement.style.setProperty('--my', String(ny))
    }

    const handleMouseLeave = () => {
      targetPos.current = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5,
      }
    }

    const render = () => {
      spotlightPos.current.x = lerp(spotlightPos.current.x, targetPos.current.x, fadeSpeed)
      spotlightPos.current.y = lerp(spotlightPos.current.y, targetPos.current.y, fadeSpeed)

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.fillStyle = `rgba(0, 0, 0, ${maskAlpha})`
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

      const pulseScale = 1 + 0.1 * Math.sin((Date.now() / pulseSpeed) * Math.PI * 2)
      const currentSpotlightSize = liveSpotlightSize * pulseScale

      const gradient = ctx.createRadialGradient(
        spotlightPos.current.x,
        spotlightPos.current.y,
        0,
        spotlightPos.current.x,
        spotlightPos.current.y,
        currentSpotlightSize,
      )
      gradient.addColorStop(0, `rgba(${glowColor}, ${spotlightIntensity})`)
      gradient.addColorStop(0.55, `rgba(${glowColor}, ${spotlightIntensity * 0.82})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(
        spotlightPos.current.x,
        spotlightPos.current.y,
        currentSpotlightSize,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'
      const glowGradient = ctx.createRadialGradient(
        spotlightPos.current.x,
        spotlightPos.current.y,
        0,
        spotlightPos.current.x,
        spotlightPos.current.y,
        currentSpotlightSize * 1.2,
      )
      glowGradient.addColorStop(0, `rgba(${glowColor}, 0.34)`)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(
        spotlightPos.current.x,
        spotlightPos.current.y,
        currentSpotlightSize * 1.2,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      animationFrame.current = window.requestAnimationFrame(render)
    }

    resizeCanvas()
    targetPos.current = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
    spotlightPos.current = { ...targetPos.current }

    window.addEventListener('resize', resizeCanvas)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('touchstart', handleTouchMove, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchstart', handleTouchMove)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrame.current) window.cancelAnimationFrame(animationFrame.current)
    }
  }, [spotlightSize, spotlightIntensity, fadeSpeed, glowColor, pulseSpeed])

  return canvasRef
}
