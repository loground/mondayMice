import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const DRACO_DECODER_PATH = '/draco/gltf/'

export function withLocalDraco(loader) {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
  dracoLoader.setDecoderConfig({ type: 'wasm' })
  loader.setDRACOLoader(dracoLoader)
}
