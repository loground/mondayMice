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
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useHoverMotion } from '../../hooks/useHoverMotion'
import { createPlanarUVGeometry } from '../../utils/threeHelpers'

function withDraco(loader) {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
  loader.setDRACOLoader(dracoLoader)
}

export function TvModel({ hovered = false, tiltSign = 1, ...props }) {
  const gltf = useLoader(GLTFLoader, '/tv.glb', withDraco)
  const { nodes, materials } = gltf

  const groupRef = useRef(null)
  const modelRef = useRef(null)
  const [fitScale, setFitScale] = useState(1)
  const [centerOffset, setCenterOffset] = useState([0, 0, 0])
  const [videoTexture, setVideoTexture] = useState(null)
  const hasSignaledVideoReady = useRef(false)
  const channelOrder = useMemo(
    () => ['/tvchannels/1.mp4', '/tvchannels/2.mp4', '/tvchannels/3.mp4'].sort(() => Math.random() - 0.5),
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
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.disablePictureInPicture = true

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
    const attemptPlay = () => {
      const playPromise = video.play()
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            markVideoReady()
          })
          .catch(() => {})
      } else {
        markVideoReady()
      }
    }

    const loadChannel = (index) => {
      if (index >= channelOrder.length) return
      currentIndex.value = index
      video.src = channelOrder[index]
      video.load()
      attemptPlay()
    }

    const tryPlay = () => {
      attemptPlay()
    }
    const onLoadedMetadata = () => {
      applyCenterCrop()
      tryPlay()
    }
    const onVideoError = () => {
      loadChannel(currentIndex.value + 1)
    }
    const onUserGestureUnlock = () => {
      attemptPlay()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') attemptPlay()
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('canplay', tryPlay)
    video.addEventListener('playing', markVideoReady)
    video.addEventListener('error', onVideoError)
    window.addEventListener('pointerdown', onUserGestureUnlock, { passive: true })
    window.addEventListener('touchstart', onUserGestureUnlock, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    loadChannel(0)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('canplay', tryPlay)
      video.removeEventListener('playing', markVideoReady)
      video.removeEventListener('error', onVideoError)
      window.removeEventListener('pointerdown', onUserGestureUnlock)
      window.removeEventListener('touchstart', onUserGestureUnlock)
      document.removeEventListener('visibilitychange', onVisibilityChange)
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
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_1'].geometry}
          material={materials['Material.004']}
          position={[-0.078, 0.041, -0.104]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.384}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_2'].geometry}
          material={materials.кожа}
          position={[-0.067, 0.291, 0.057]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.214}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_3'].geometry}
          material={materials['Material.006']}
          position={[0.088, 0.294, 0.029]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.082}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_4'].geometry}
          material={materials['Material.007']}
          position={[0.065, 0.26, 0.036]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.011}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_5'].geometry}
          material={materials['шерсть ']}
          position={[-0.035, 0.308, 0.079]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.158}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_6'].geometry}
          material={materials['основа телека']}
          position={[-0.099, -0.079, -0.104]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.387}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_7'].geometry}
          material={materials['кнопки ножки и антены']}
          position={[-0.079, -0.012, -0.089]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.387}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['1_8'].geometry}
          material={materials.палки}
          position={[-0.018, 0.304, -0.216]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.144}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={screenGeometry || nodes['1001'].geometry}
          position={[0.088, -0.001, -0.099]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.279}
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

useLoader.preload(GLTFLoader, '/tv.glb', withDraco)
