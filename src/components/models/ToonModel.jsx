import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, Color, MeshToonMaterial, SRGBColorSpace, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useHoverMotion } from '../../hooks/useHoverMotion'
import { createToonGradientMap } from '../../utils/threeHelpers'

export function ToonModel({ modelPath, hovered = false, tiltSign = 1, useToon = true }) {
  const gltf = useLoader(GLTFLoader, modelPath)
  const groupRef = useRef(null)

  const toonGradient = useMemo(() => createToonGradientMap(), [])

  const clonedScene = useMemo(() => {
    const root = gltf.scene.clone(true)
    root.traverse((child) => {
      if (!child.isMesh) return

      const srcMaterial = child.material
      const srcMaterials = Array.isArray(srcMaterial) ? srcMaterial : [srcMaterial]
      const toonMaterials = srcMaterials.map((material) => {
        const sourceMap = material?.map ?? null
        if (sourceMap) sourceMap.colorSpace = SRGBColorSpace

        if (!useToon) {
          const fallback = material?.clone?.() ?? material
          if (fallback?.map) fallback.map.colorSpace = SRGBColorSpace
          if (fallback?.emissive && typeof fallback.emissiveIntensity === 'number') {
            fallback.emissiveIntensity = Math.max(fallback.emissiveIntensity, 0.12)
          }
          return fallback
        }

        const baseColor = material?.color ? material.color.clone() : new Color('#f2f2f2')
        baseColor.offsetHSL(0, 0, -0.08)

        return new MeshToonMaterial({
          color: baseColor,
          map: sourceMap,
          transparent: material?.transparent ?? false,
          opacity: material?.opacity ?? 1,
          side: material?.side,
          gradientMap: toonGradient,
          emissive: baseColor.clone().multiplyScalar(0.24),
          emissiveIntensity: 0.42,
        })
      })

      child.material = Array.isArray(srcMaterial) ? toonMaterials : toonMaterials[0]
      child.castShadow = true
      child.receiveShadow = true
    })
    return root
  }, [gltf.scene, toonGradient, useToon])

  const fitScale = useMemo(() => {
    const box = new Box3().setFromObject(clonedScene)
    const size = new Vector3()
    box.getSize(size)
    const maxAxis = Math.max(size.x, size.y, size.z) || 1
    return 2.2 / maxAxis
  }, [clonedScene])

  const centeredPosition = useMemo(() => {
    const box = new Box3().setFromObject(clonedScene)
    const center = new Vector3()
    box.getCenter(center)
    return [-center.x * fitScale, -center.y * fitScale, -center.z * fitScale]
  }, [clonedScene, fitScale])

  useLayoutEffect(() => {
    return () => {
      toonGradient.dispose()
      clonedScene.traverse((child) => {
        if (!child.isMesh) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((material) => {
          if (material?.isMaterial) material.dispose()
        })
      })
    }
  }, [clonedScene, toonGradient])

  useHoverMotion(groupRef, hovered, tiltSign)

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} position={centeredPosition} scale={fitScale} />
    </group>
  )
}

useLoader.preload(GLTFLoader, '/cart.glb')
