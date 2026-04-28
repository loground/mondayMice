import { useFrame, useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Box3, CanvasTexture, LinearFilter, SRGBColorSpace, Vector3 } from 'three'
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
  const soonOrbitRef = useRef(null)
  const showSoonOrbit = modelPath === '/cart.glb'

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

  const soonOrbitTexture = useMemo(() => {
    if (!showSoonOrbit) return null
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ff2d2d'
    ctx.strokeStyle = '#240000'
    ctx.lineWidth = 8
    ctx.font = '900 90px Arial Black, Impact, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText('S O O N', canvas.width / 2, canvas.height / 2 + 4)
    ctx.fillText('S O O N', canvas.width / 2, canvas.height / 2 + 4)

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.needsUpdate = true
    return texture
  }, [showSoonOrbit])

  useLayoutEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if (!child.isMesh) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((material) => {
          if (material?.isMaterial) material.dispose()
        })
      })
      soonOrbitTexture?.dispose?.()
    }
  }, [clonedScene, soonOrbitTexture])

  useHoverMotion(groupRef, hovered, tiltSign)

  useFrame((state) => {
    if (!showSoonOrbit || !soonOrbitRef.current) return
    const t = state.clock.elapsedTime
    soonOrbitRef.current.rotation.y = Math.sin(t * 0.55) * 0.08
    soonOrbitRef.current.position.y = -0.12 + Math.sin(t * 1.1) * 0.015
  })

  return (
    <group ref={groupRef}>
      <group position={centeredPosition} scale={fitScale}>
        <primitive object={clonedScene} />
        {showSoonOrbit && soonOrbitTexture ? (
          <group ref={soonOrbitRef}>
            <sprite position={[0.46, 0.3, 0.22]} scale={[0.5, 0.128, 1]}>
              <spriteMaterial
                map={soonOrbitTexture}
                transparent
                opacity={0.95}
                depthWrite={false}
                depthTest={false}
                blending={AdditiveBlending}
              />
            </sprite>
          </group>
        ) : null}
      </group>
    </group>
  )
}

useLoader.preload(GLTFLoader, '/cart.glb', withDraco)
