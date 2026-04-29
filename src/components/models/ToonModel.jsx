import { useFrame, useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, CanvasTexture, LinearFilter, SRGBColorSpace, Vector3 } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useHoverMotion } from '../../hooks/useHoverMotion'

function withDraco(loader) {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
  loader.setDRACOLoader(dracoLoader)
}

export function ToonModel({ modelPath, hovered = false, tiltSign = 1, selected = false }) {
  const gltf = useLoader(GLTFLoader, modelPath, withDraco)
  const groupRef = useRef(null)
  const soonRef = useRef(null)
  const showSoonSign = modelPath === '/cart.glb' || modelPath === '/cartNew.glb'

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
    return 2.6 / maxAxis
  }, [clonedScene])

  const centeredPosition = useMemo(() => {
    const box = new Box3().setFromObject(clonedScene)
    const center = new Vector3()
    box.getCenter(center)
    return [-center.x * fitScale, -center.y * fitScale + 0.2, -center.z * fitScale]
  }, [clonedScene, fitScale])

  const soonTexture = useMemo(() => {
    if (!showSoonSign) return null
    const label = selected ? 'B A C K' : 'S O O N'
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#C51925'
    ctx.strokeStyle = '#240000'
    ctx.lineWidth = 20
    ctx.font = '900 90px "Comic Sans MS", "Chalkboard SE", "Marker Felt", "Papyrus", cursive'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText(label, canvas.width / 2, canvas.height / 2 + 4)
    ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 4)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.needsUpdate = true
    return texture
  }, [showSoonSign, selected])

  useLayoutEffect(() => {
    return () => {
      clonedScene.traverse((child) => {
        if (!child.isMesh) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((material) => {
          if (material?.isMaterial) material.dispose()
        })
      })
      soonTexture?.dispose?.()
    }
  }, [clonedScene, soonTexture])

  useHoverMotion(groupRef, hovered, tiltSign)

  useFrame((state) => {
    if (!soonRef.current) return
    const t = state.clock.elapsedTime
    soonRef.current.position.y = 0.3 + Math.sin(t * 1.1) * 0.012
  })

  return (
    <group ref={groupRef}>
      <group position={centeredPosition} scale={fitScale}>
        <primitive object={clonedScene} />
        {showSoonSign && soonTexture ? (
          <sprite ref={soonRef} position={[0.0, 0, -0.28]} scale={[0.35, 0.09, 0]}>
            <spriteMaterial
              map={soonTexture}
              transparent
              alphaTest={0.08}
              opacity={1}
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
            />
          </sprite>
        ) : null}
      </group>
    </group>
  )
}

useLoader.preload(GLTFLoader, '/cart.glb', withDraco)
