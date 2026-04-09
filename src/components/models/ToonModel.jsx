import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, SRGBColorSpace, Vector3 } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useHoverMotion } from '../../hooks/useHoverMotion'

function withDraco(loader) {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
  loader.setDRACOLoader(dracoLoader)
}

export function ToonModel({ modelPath, hovered = false, tiltSign = 1 }) {
  const gltf = useLoader(GLTFLoader, modelPath, withDraco)
  const groupRef = useRef(null)

  const clonedScene = useMemo(() => {
    const root = gltf.scene.clone(true)
    root.traverse((child) => {
      if (!child.isMesh) return

      const srcMaterial = child.material
      const srcMaterials = Array.isArray(srcMaterial) ? srcMaterial : [srcMaterial]
      const clonedMaterials = srcMaterials.map((material) => {
        const sourceMap = material?.map ?? null
        if (sourceMap) sourceMap.colorSpace = SRGBColorSpace

        const fallback = material?.clone?.() ?? material
        if (fallback?.map) fallback.map.colorSpace = SRGBColorSpace
        if (fallback?.emissive && typeof fallback.emissiveIntensity === 'number') {
          fallback.emissiveIntensity = Math.max(fallback.emissiveIntensity, 0.12)
        }
        return fallback
      })

      child.material = Array.isArray(srcMaterial) ? clonedMaterials : clonedMaterials[0]
      child.castShadow = true
      child.receiveShadow = true
    })
    return root
  }, [gltf.scene])

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
      clonedScene.traverse((child) => {
        if (!child.isMesh) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((material) => {
          if (material?.isMaterial) material.dispose()
        })
      })
    }
  }, [clonedScene])

  useHoverMotion(groupRef, hovered, tiltSign)

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} position={centeredPosition} scale={fitScale} />
    </group>
  )
}

useLoader.preload(GLTFLoader, '/cart.glb', withDraco)
