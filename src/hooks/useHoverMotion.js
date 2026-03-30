import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'

export function useHoverMotion(groupRef, hovered, tiltSign = 1) {
  useFrame((state, delta) => {
    if (!groupRef.current) return

    const baseYaw = -Math.PI / 2
    const t = state.clock.elapsedTime
    const baseY = Math.sin(t * 1.15) * 0.035
    const hoverY = hovered ? 0.06 : 0
    const hoverRotY = hovered ? tiltSign * 0.26 : tiltSign * 0.08
    const hoverRotX = hovered ? -0.08 : -0.02

    groupRef.current.position.y = MathUtils.damp(groupRef.current.position.y, baseY + hoverY, 2.8, delta)
    groupRef.current.rotation.y = MathUtils.damp(
      groupRef.current.rotation.y,
      baseYaw + hoverRotY,
      2.8,
      delta,
    )
    groupRef.current.rotation.x = MathUtils.damp(groupRef.current.rotation.x, hoverRotX, 2.8, delta)
  })
}
