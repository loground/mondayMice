import { useLoader } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Box3,
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  SRGBColorSpace,
  Vector3,
  VideoTexture,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useHoverMotion } from '../../hooks/useHoverMotion'
import { createPlanarUVGeometry } from '../../utils/threeHelpers'

export function TvModel({ hovered = false, tiltSign = 1, ...props }) {
  const gltf = useLoader(GLTFLoader, '/tv.glb')
  const { nodes, materials } = gltf

  const groupRef = useRef(null)
  const modelRef = useRef(null)
  const [fitScale, setFitScale] = useState(1)
  const [centerOffset, setCenterOffset] = useState([0, 0, 0])
  const [videoTexture, setVideoTexture] = useState(null)
  const hasSignaledVideoReady = useRef(false)

  const screenGeometry = useMemo(() => {
    const source = nodes?.['1001']?.geometry
    if (!source) return null
    return createPlanarUVGeometry(source)
  }, [nodes])

  useEffect(() => {
    const video = document.createElement('video')
    video.src = '/vid.mp4'
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.preload = 'auto'
    video.defaultMuted = true

    const texture = new VideoTexture(video)
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.wrapS = ClampToEdgeWrapping
    texture.wrapT = ClampToEdgeWrapping
    texture.flipY = false
    texture.colorSpace = SRGBColorSpace
    texture.center.set(0.5, 0.5)
    texture.repeat.set(0.96, 0.96)
    texture.offset.set(0.02, 0.02)

    setVideoTexture(texture)
    const markVideoReady = () => {
      if (hasSignaledVideoReady.current) return
      hasSignaledVideoReady.current = true
      window.dispatchEvent(new CustomEvent('tv-video-ready'))
    }

    const tryPlay = () => {
      video.play().catch(() => {})
      markVideoReady()
    }
    video.addEventListener('canplay', tryPlay)
    tryPlay()

    return () => {
      video.removeEventListener('canplay', tryPlay)
      video.pause()
      video.removeAttribute('src')
      video.load()
      texture.dispose()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (screenGeometry?.isBufferGeometry) {
        screenGeometry.dispose()
      }
    }
  }, [screenGeometry])

  useLayoutEffect(() => {
    if (!modelRef.current) return
    const box = new Box3().setFromObject(modelRef.current)
    const size = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxAxis = Math.max(size.x, size.y, size.z) || 1
    const nextScale = 2.2 / maxAxis
    setFitScale(nextScale)
    setCenterOffset([-center.x * nextScale, -center.y * nextScale, -center.z * nextScale])
  }, [nodes, materials])

  useHoverMotion(groupRef, hovered, tiltSign)

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <group ref={modelRef} position={centerOffset} scale={fitScale}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow receiveShadow geometry={nodes['1_1'].geometry} material={materials['Material.004']} />
          <mesh castShadow receiveShadow geometry={nodes['1_2'].geometry} material={materials.кожа} />
          <mesh castShadow receiveShadow geometry={nodes['1_3'].geometry} material={materials['Material.006']} />
          <mesh castShadow receiveShadow geometry={nodes['1_4'].geometry} material={materials['Material.007']} />
          <mesh castShadow receiveShadow geometry={nodes['1_5'].geometry} material={materials['шерсть ']} />
          <mesh castShadow receiveShadow geometry={nodes['1_6'].geometry} material={materials['основа телека']} />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['1_7'].geometry}
            material={materials['кнопки ножки и антены']}
          />
          <mesh castShadow receiveShadow geometry={nodes['1_8'].geometry} material={materials.палки} />
        </group>
        <mesh
          castShadow
          receiveShadow
          geometry={screenGeometry || nodes['1001'].geometry}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial map={videoTexture} toneMapped={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

useLoader.preload(GLTFLoader, '/tv.glb')
