// Synthetic in-memory GLB fixtures ONLY. No character/model asset files generated.
export function glbDocument(document, binary = null) {
  const json = new TextEncoder().encode(JSON.stringify(document));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const binaryLength = binary ? Math.ceil(binary.length / 4) * 4 : 0;
  const result = new Uint8Array(20 + jsonLength + (binary ? 8 + binaryLength : 0));
  const view = new DataView(result.buffer);
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true); view.setUint32(8, result.length, true);
  view.setUint32(12, jsonLength, true); view.setUint32(16, 0x4e4f534a, true);
  result.fill(32, 20, 20 + jsonLength); result.set(json, 20);
  if (binary) {
    const offset = 20 + jsonLength;
    view.setUint32(offset, binaryLength, true); view.setUint32(offset + 4, 0x004e4942, true);
    result.set(binary, offset + 8);
  }
  return result;
}
export function animatedTestGlb() {
  const values = new Float32Array([0, 1, 0, 0, 0, 1, 0, 0]);
  return glbDocument({
    asset: { version: '2.0' }, scenes: [{ nodes: [0] }], scene: 0, nodes: [{ name: 'FixtureNode' }],
    buffers: [{ byteLength: 32 }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 8 }, { buffer: 0, byteOffset: 8, byteLength: 24 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] }, { bufferView: 1, componentType: 5126, count: 2, type: 'VEC3' }],
    animations: [{ name: 'FixtureMotion', samplers: [{ input: 0, output: 1, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }] }],
  }, new Uint8Array(values.buffer));
}
