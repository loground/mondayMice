import {
  DataTexture,
  Float32BufferAttribute,
  NearestFilter,
  RedFormat,
  Vector3,
} from 'three'

export function createToonGradientMap() {
  const shades = 5
  const data = new Uint8Array(shades)

  for (let i = 0; i < shades; i += 1) {
    data[i] = Math.round((i / (shades - 1)) * 255)
  }

  const texture = new DataTexture(data, shades, 1, RedFormat)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

export function createPlanarUVGeometry(sourceGeometry) {
  const geom = sourceGeometry.clone()
  const position = geom.getAttribute('position')
  if (!position) return geom

  geom.computeBoundingBox()
  if (!geom.boundingBox) return geom

  const min = geom.boundingBox.min
  const max = geom.boundingBox.max
  const size = new Vector3().subVectors(max, min)

  const axes = [
    { index: 0, len: size.x },
    { index: 1, len: size.y },
    { index: 2, len: size.z },
  ].sort((a, b) => b.len - a.len)

  const uAxis = axes[0].index
  const vAxis = axes[1].index
  const mins = [min.x, min.y, min.z]
  const ranges = [Math.max(size.x, 1e-6), Math.max(size.y, 1e-6), Math.max(size.z, 1e-6)]

  const uvArray = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i += 1) {
    const p = [position.getX(i), position.getY(i), position.getZ(i)]
    const u = (p[uAxis] - mins[uAxis]) / ranges[uAxis]
    const v = (p[vAxis] - mins[vAxis]) / ranges[vAxis]
    uvArray[i * 2] = u
    uvArray[i * 2 + 1] = v
  }

  geom.setAttribute('uv', new Float32BufferAttribute(uvArray, 2))
  return geom
}
