import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Box3, CanvasTexture, DoubleSide, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
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
  const showSoonSign = modelPath === '/newMouse.glb'
  const soonTexture = useLoader(TextureLoader, '/soon.png')
  const soonSignTexture = useMemo(() => {
    if (!showSoonSign || !soonTexture?.image) return null
    const image = soonTexture.image
    const source = document.createElement('canvas')
    source.width = image.width
    source.height = image.height
    const sourceCtx = source.getContext('2d')
    if (!sourceCtx) return soonTexture
    sourceCtx.drawImage(image, 0, 0)

    const sourceImg = sourceCtx.getImageData(0, 0, source.width, source.height)
    const d = sourceImg.data
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]
      const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 160
      if (isGray) d[i + 3] = 0
    }
    sourceCtx.putImageData(sourceImg, 0, 0)

    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (!ctx) return soonTexture

    const drawW = canvas.width * 0.44
    const drawH = drawW * (source.height / source.width)
    const drawX = (canvas.width - drawW) * 0.5
    const drawY = (canvas.height - drawH) * 0.52
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, drawX, drawY, drawW, drawH)

    const centeredImg = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const cd = centeredImg.data
    for (let i = 0; i < cd.length; i += 4) {
      if (cd[i + 3] < 10) cd[i + 3] = 0
      else cd[i + 3] = Math.min(255, cd[i + 3] + 15)
    }
    ctx.putImageData(centeredImg, 0, 0)

    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.minFilter = LinearFilter
    tex.magFilter = LinearFilter
    tex.needsUpdate = true
    return tex
  }, [showSoonSign, soonTexture])

  const clonedScene = useMemo(() => {
    const root = gltf.scene.clone(true)
    const meshList = []
    root.traverse((child) => {
      if (!child.isMesh) return
      meshList.push(child)

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

    if (showSoonSign && soonSignTexture && meshList[1]) {
      const signMesh = meshList[1]
      signMesh.geometry.computeBoundingBox()
      const bbox = signMesh.geometry.boundingBox

      if (bbox) {
        const size = new Vector3()
        const center = new Vector3()
        bbox.getSize(size)
        bbox.getCenter(center)

        const labelMat = new MeshBasicMaterial({
          map: soonSignTexture,
          transparent: true,
          alphaTest: 0.02,
          side: DoubleSide,
          toneMapped: false,
        })
        const labelGeom = new PlaneGeometry(
          Math.max(size.x * 2.8, 0),
          Math.max(size.y * 1.08, 0.13),
        )
        const label = new Mesh(labelGeom, labelMat)
        label.name = 'soon-on-sign'

        const absX = Math.abs(size.x)
        const absY = Math.abs(size.y)
        const absZ = Math.abs(size.z)
        const thinAxis = absX <= absY && absX <= absZ ? 'x' : absY <= absX && absY <= absZ ? 'y' : 'z'

        if (thinAxis === 'x') label.rotation.y = Math.PI / 2
        if (thinAxis === 'y') label.rotation.x = -Math.PI / 2

        const pushBase = thinAxis === 'x' ? size.x : thinAxis === 'y' ? size.y : size.z
        const push = Math.max(Math.abs(pushBase) * 0.303, 0.0004)
        const x = center.x + size.x * 0.04 + (thinAxis === 'x' ? Math.sign(pushBase || 1) * push : 0)
        const y = center.y - size.y * 0.02 + (thinAxis === 'y' ? Math.sign(pushBase || 1) * push : 0)
        const z = center.z + (thinAxis === 'z' ? Math.sign(pushBase || 1) * push : 0)
        label.position.set(x, y, z)
        signMesh.add(label)
      }
    }

    return root
  }, [gltf.scene, showSoonSign, soonSignTexture])

  const fitScale = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene)
    const size = new Vector3()
    box.getSize(size)
    const maxAxis = Math.max(size.x, size.y, size.z) || 1
    return 2.6 / maxAxis
  }, [gltf.scene])

  const centeredPosition = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene)
    const center = new Vector3()
    box.getCenter(center)
    return [-center.x * fitScale, -center.y * fitScale + 0.2, -center.z * fitScale]
  }, [gltf.scene, fitScale])

  useMemo(() => {
    if (!showSoonSign || !soonTexture) return null
    soonTexture.colorSpace = SRGBColorSpace
    soonTexture.minFilter = LinearFilter
    soonTexture.magFilter = LinearFilter
    soonTexture.needsUpdate = true
    return null
  }, [showSoonSign, soonTexture])

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
      <group position={centeredPosition} scale={fitScale}>
        <primitive object={clonedScene} />
      </group>
    </group>
  )
}

useLoader.preload(GLTFLoader, '/newMouse.glb', withDraco)
