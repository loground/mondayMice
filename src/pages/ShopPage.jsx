import { Canvas } from '@react-three/fiber'
import { ToonModel } from '../components/models/ToonModel'

export function ShopPage({ onBack }) {
  return (
    <main className="shop-page" aria-label="Shop page">
      <button type="button" className="shop-page__corner-model" onClick={onBack} aria-label="Back">
        <Canvas camera={{ position: [0, 0, 4.8], fov: 34 }} dpr={[1, 2]}>
          <ambientLight intensity={0.72} color="#f5f1e8" />
          <hemisphereLight intensity={0.86} color="#ffe2b5" groundColor="#9fb3d8" />
          <directionalLight position={[2.8, 3.2, 2]} intensity={1.1} color="#ffdcb2" />
          <directionalLight position={[-2, 1.8, -2.2]} intensity={0.55} color="#ccdcff" />
          <ToonModel modelPath="/newMouse.glb" selected />
        </Canvas>
      </button>

      <section className="shop-page__content">
        <img className="shop-page__image" src="/cartContent.png" alt="Cart content" />
      </section>
    </main>
  )
}
