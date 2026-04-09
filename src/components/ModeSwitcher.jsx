import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimationMixer, LoopOnce } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

function withDraco(loader) {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
  loader.setDRACOLoader(dracoLoader)
}

function SwitcherModel({ playTick, mode }) {
  const groupRef = useRef(null)
  const mixerRef = useRef(null)
  const actionsRef = useRef([])
  const targetTimesRef = useRef([])
  const playingRef = useRef([])
  const { nodes, materials, animations } = useLoader(GLTFLoader, '/switcher.glb', withDraco)

  useEffect(() => {
    if (!groupRef.current) return undefined
    const mixer = new AnimationMixer(groupRef.current)
    mixerRef.current = mixer
    actionsRef.current = animations.map((clip) => {
      const action = mixer.clipAction(clip)
      action.setLoop(LoopOnce, 1)
      action.clampWhenFinished = true
      action.enabled = true
      action.paused = true
      action.time = 0
      action.play()
      return action
    })
    targetTimesRef.current = actionsRef.current.map(() => 0)
    playingRef.current = actionsRef.current.map(() => false)

    return () => {
      actionsRef.current.forEach((action) => action.stop())
      mixer.stopAllAction()
      actionsRef.current = []
      mixerRef.current = null
      targetTimesRef.current = []
      playingRef.current = []
    }
  }, [animations])

  useEffect(() => {
    if (playTick === 0) return
    const toSpotlight = mode === 'spotlight'
    actionsRef.current.forEach((action, index) => {
      const clipDuration = action.getClip().duration
      const halfTime = clipDuration * 0.5
      const targetTime = toSpotlight ? halfTime : 0

      action.reset()
      action.enabled = true
      action.paused = false
      action.timeScale = toSpotlight ? 1 : -1
      action.time = toSpotlight ? 0 : halfTime
      targetTimesRef.current[index] = targetTime
      playingRef.current[index] = true
      action.play()
    })
  }, [mode, playTick])

  useFrame((_, delta) => {
    if (!mixerRef.current) return

    mixerRef.current.update(delta)
    actionsRef.current.forEach((action, index) => {
      if (!playingRef.current[index]) return
      const target = targetTimesRef.current[index]
      const reachedTarget =
        action.timeScale > 0 ? action.time >= target - 0.001 : action.time <= target + 0.001
      if (!reachedTarget) return

      action.time = target
      action.paused = true
      playingRef.current[index] = false
    })
  })

  return (
    <group ref={groupRef} dispose={null} rotation={[0, 0, 0]} scale={8}>
      <group name="AuxScene">
        <primitive object={nodes._rootJoint} />
        
        <skinnedMesh
          name="Object_9"
          geometry={nodes.Object_9.geometry}
          material={materials['01_-_Default']}
          skeleton={nodes.Object_9.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.025}
        />
      </group>
    </group>
  )
}

useLoader.preload(GLTFLoader, '/switcher.glb', withDraco)

export function ModeSwitcher({ mode, onChange }) {
  const [playTick, setPlayTick] = useState(0)
  const label = useMemo(() => (mode === 'spotlight' ? 'Spotlight' : 'Regular'), [mode])

  const toggleMode = () => {
    setPlayTick((value) => value + 1)
    onChange(mode === 'regular' ? 'spotlight' : 'regular')
  }

  return (
    <button
      type="button"
      className={`mode-switcher-3d ${mode === 'spotlight' ? 'is-spotlight' : 'is-regular'}`}
      onClick={toggleMode}
      aria-label={`Switch display mode, current mode ${label}`}
    >
      <Canvas camera={{ position: [0, 0.18, 8.8], fov: 34 }} dpr={[1, 1.8]}>
        <ambientLight intensity={0.9} color="#f6f5f1" />
        <directionalLight position={[1.8, 2.4, 2]} intensity={1.2} color="#fff5dc" />
        <directionalLight position={[-1.6, 1.2, -1.5]} intensity={0.45} color="#9fb2d4" />
        <SwitcherModel playTick={playTick} mode={mode}  />
      </Canvas>
    </button>
  )
}
