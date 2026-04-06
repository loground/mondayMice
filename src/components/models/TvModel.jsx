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
  const channelOrder = useMemo(
    () => ['/tvchannels/1.mp4', '/tvchannels/2.mp4', '/tvchannels/3.mov', '/tvchannels/4.mp4'].sort(() => Math.random() - 0.5),
    [],
  )

  const screenGeometry = useMemo(() => {
    const source = nodes?.['1001']?.geometry
    if (!source) return null
    return createPlanarUVGeometry(source)
  }, [nodes])

  const screenAspect = useMemo(() => {
    const geometry = screenGeometry || nodes?.['1001']?.geometry
    if (!geometry) return 16 / 9
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box) return 16 / 9
    const size = new Vector3()
    box.getSize(size)
    const dims = [Math.abs(size.x), Math.abs(size.y), Math.abs(size.z)].sort((a, b) => b - a)
    const width = dims[0] || 1
    const height = dims[1] || 1
    return width / Math.max(height, 1e-6)
  }, [nodes, screenGeometry])

  useEffect(() => {
    const video = document.createElement('video')
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
    texture.repeat.set(1, 1)
    texture.offset.set(0, 0)

    setVideoTexture(texture)
    const markVideoReady = () => {
      if (hasSignaledVideoReady.current) return
      hasSignaledVideoReady.current = true
      window.dispatchEvent(new CustomEvent('tv-video-ready'))
    }

    const applyCenterCrop = () => {
      const vw = video.videoWidth || 1
      const vh = video.videoHeight || 1
      const videoAspect = vw / Math.max(vh, 1e-6)
      const targetAspect = screenAspect || 16 / 9

      let repeatX = 1
      let repeatY = 1

      if (videoAspect > targetAspect) {
        repeatX = targetAspect / videoAspect
      } else {
        repeatY = videoAspect / targetAspect
      }

      // Pull crop slightly toward full frame so the channel looks less zoomed.
      const zoomOutFactor = 0.5
      repeatX += (1 - repeatX) * zoomOutFactor
      repeatY += (1 - repeatY) * zoomOutFactor

      texture.repeat.set(repeatX, repeatY)
      texture.offset.set((1 - repeatX) * 0.5, (1 - repeatY) * 0.5)
      texture.needsUpdate = true
    }

    const currentIndex = { value: 0 }
    const loadChannel = (index) => {
      if (index >= channelOrder.length) return
      currentIndex.value = index
      video.src = channelOrder[index]
      video.load()
      video.play().catch(() => {})
    }

    const tryPlay = () => {
      video.play().catch(() => {})
      markVideoReady()
    }
    const onLoadedMetadata = () => {
      applyCenterCrop()
      tryPlay()
    }
    const onVideoError = () => {
      loadChannel(currentIndex.value + 1)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('canplay', tryPlay)
    video.addEventListener('error', onVideoError)
    loadChannel(0)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('canplay', tryPlay)
      video.removeEventListener('error', onVideoError)
      video.pause()
      video.removeAttribute('src')
      video.load()
      texture.dispose()
    }
  }, [channelOrder, screenAspect])

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
          <meshBasicMaterial
            map={videoTexture}
            toneMapped={false}
            side={DoubleSide}
            onBeforeCompile={(shader) => {
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `
                #ifdef USE_MAP
                  vec2 mondayUv = vec2(1.0 - vMapUv.x, vMapUv.y);
                  vec4 sampledDiffuseColor = texture2D(map, mondayUv);
                  diffuseColor *= sampledDiffuseColor;
                #endif
                `,
              )
            }}
          />
        </mesh>
      </group>
    </group>
  )
}

useLoader.preload(GLTFLoader, '/tv.glb')
