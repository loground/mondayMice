import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { MathUtils } from 'three'
import { ToonModel } from './models/ToonModel'
import { TvModel } from './models/TvModel'

function CursorFollowerLight({ active }) {
  const lightRef = useRef(null)

  useFrame((_, delta) => {
    if (!lightRef.current) return

    const styles = getComputedStyle(document.documentElement)
    const mx = Number.parseFloat(styles.getPropertyValue('--mx')) || 0.5
    const my = Number.parseFloat(styles.getPropertyValue('--my')) || 0.5
    const px = mx * 2 - 1
    const py = (1 - my) * 2 - 1

    const targetX = px * 2.5
    const targetY = py * 1.7
    const targetZ = active ? 2.9 : 2.4

    lightRef.current.position.x = MathUtils.damp(lightRef.current.position.x, targetX, 3.2, delta)
    lightRef.current.position.y = MathUtils.damp(lightRef.current.position.y, targetY, 3.2, delta)
    lightRef.current.position.z = MathUtils.damp(lightRef.current.position.z, targetZ, 3.2, delta)
    lightRef.current.intensity = MathUtils.damp(
      lightRef.current.intensity,
      active ? 2.8 : 1.8,
      3.2,
      delta,
    )
  })

  return <pointLight ref={lightRef} color="#f5f4ff" intensity={1.8} distance={11} decay={1.2} />
}

export function ModelSlot({
  canvasKey,
  className,
  modelPath,
  modelType,
  tiltSign,
  mode,
  selected,
  selectedMotion,
  away,
  onToggle,
}) {
  const [hovered, setHovered] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const isSpotlightMode = mode === 'spotlight'
  const lightActive = isSpotlightMode && (hovered || isCoarsePointer)

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const syncPointer = () => setIsCoarsePointer(media.matches)
    syncPointer()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncPointer)
      return () => media.removeEventListener('change', syncPointer)
    }
    media.addListener(syncPointer)
    return () => media.removeListener(syncPointer)
  }, [])

  return (
    <div
      className={`model-slot ${className} ${selected ? 'is-selected' : ''} ${away ? 'is-away' : ''}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      style={
        selected && selectedMotion
          ? {
              '--sel-x': `${selectedMotion.x}px`,
              '--sel-y': `${selectedMotion.y}px`,
            }
          : undefined
      }
      onClick={(event) => onToggle(event.currentTarget)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onToggle(event.currentTarget)
      }}
    >
      <Canvas key={canvasKey} camera={{ position: [0, 0, 4.8], fov: 34 }} dpr={[1, 2]}>
        <ambientLight
          intensity={isSpotlightMode ? (isCoarsePointer ? 0.48 : 0.3) : 0.72}
          color={isSpotlightMode ? '#8f98b5' : '#f5f1e8'}
        />
        <hemisphereLight
          intensity={isSpotlightMode ? (isCoarsePointer ? 0.58 : 0.36) : 0.86}
          color={isSpotlightMode ? '#3e4963' : '#ffe2b5'}
          groundColor={isSpotlightMode ? '#090b12' : '#9fb3d8'}
        />
        <directionalLight
          position={[2.8, 3.2, 2]}
          intensity={isSpotlightMode ? 0.55 : 1.1}
          color={isSpotlightMode ? '#8ea1cf' : '#ffdcb2'}
        />
        <directionalLight
          position={[-2, 1.8, -2.2]}
          intensity={isSpotlightMode ? 0.22 : 0.55}
          color={isSpotlightMode ? '#444f6e' : '#ccdcff'}
        />
        {isCoarsePointer ? (
          <>
            <pointLight position={[0, -0.25, 3.5]} intensity={1.2} color="#fff2dc" distance={10.5} />
            <directionalLight position={[0, -2.4, 2.1]} intensity={0.72} color="#e8f0ff" />
          </>
        ) : null}
        <CursorFollowerLight active={lightActive} />
        {modelType === 'tv' ? (
          <TvModel hovered={hovered} tiltSign={tiltSign} />
        ) : (
          <ToonModel
            modelPath={modelPath}
            hovered={hovered}
            tiltSign={tiltSign}
            useToon={!isCoarsePointer}
          />
        )}
      </Canvas>
    </div>
  )
}
