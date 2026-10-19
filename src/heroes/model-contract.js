// Conservative, self-contained GLB 2 contract: no remote/relative resources or
// decoder-dependent compression. Used by validation AND rendering before parsing.
export function inspectEmbeddedGlb(bytes, path = 'model.glb') {
  const fail = message => { throw new Error(`${path}: ${message}`); };
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 20 || bytes.byteLength > 64 * 1024 * 1024) fail('expected GLB bytes (20 bytes to 64 MiB)');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.byteLength) fail('invalid GLB 2 header/length');
  let offset = 12, document, binLength = 0;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) fail('truncated chunk header');
    const length = view.getUint32(offset, true), type = view.getUint32(offset + 4, true);
    if (length % 4 || offset + 8 + length > bytes.byteLength) fail('invalid/truncated chunk length');
    if (offset === 12 && type !== 0x4e4f534a) fail('first chunk must be JSON');
    if (type === 0x4e4f534a) {
      if (document) fail('multiple JSON chunks');
      try { document = JSON.parse(new TextDecoder().decode(bytes.subarray(offset + 8, offset + 8 + length))); }
      catch { fail('invalid JSON chunk'); }
    } else if (type === 0x004e4942) binLength += length;
    offset += 8 + length;
  }
  if (!document || document.asset?.version !== '2.0') fail('missing glTF 2.0 document');
  for (const key of ['buffers', 'images', 'animations', 'extensionsUsed', 'extensionsRequired']) {
    if (document[key] !== undefined && !Array.isArray(document[key])) fail(`${key} must be an array`);
  }
  const decoderExtensions = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu'];
  for (const extension of [...(document.extensionsUsed ?? []), ...(document.extensionsRequired ?? [])]) {
    if (decoderExtensions.includes(extension)) fail(`${extension} requires an external decoder; use uncompressed embedded assets`);
  }
  for (const resource of [...(document.buffers ?? []), ...(document.images ?? [])]) {
    if (!resource || typeof resource !== 'object') fail('invalid buffer/image record');
    if (resource.uri !== undefined && (typeof resource.uri !== 'string' || !/^data:[^,]*;base64,[a-z0-9+/=]*$/i.test(resource.uri))) {
      fail('external buffer/image URI forbidden; embed resources in GLB');
    }
  }
  const internalBuffers = (document.buffers ?? []).filter(buffer => buffer.uri === undefined);
  if (internalBuffers.length > 1 || internalBuffers.some(buffer => !Number.isInteger(buffer.byteLength) || buffer.byteLength < 0 || buffer.byteLength > binLength)) fail('invalid embedded buffer length');
  for (const animation of document.animations ?? []) {
    if (!animation || typeof animation !== 'object') fail('invalid animation record');
  }
  const clips = (document.animations ?? []).map(animation => animation.name).filter(name => typeof name === 'string' && name.length);
  if (new Set(clips).size !== clips.length) fail('animation clip names must be unique');
  return { document, clips };
}

export function decodeEmbeddedAsset(value, path) {
  if (value instanceof Uint8Array) return value;
  if (typeof value !== 'string' || !/^data:[^,]*;base64,[a-z0-9+/=]*$/i.test(value)) throw new Error(`${path}: expected bundled base64 data URL, not a runtime file/HTTP URL`);
  const decoded = atob(value.slice(value.indexOf(',') + 1));
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}
