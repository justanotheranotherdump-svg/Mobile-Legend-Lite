import * as THREE from 'three';

function material(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }); }
function mesh(geometry, mat, x = 0, y = 0, z = 0) {
  const result = new THREE.Mesh(geometry, mat);
  result.position.set(x, y, z);
  result.castShadow = true; result.receiveShadow = true;
  return result;
}
function circle(radius, color, opacity) {
  const points = Array.from({ length: 129 }, (_, i) => new THREE.Vector3(Math.cos(i / 128 * Math.PI * 2) * radius, 0.035, Math.sin(i / 128 * Math.PI * 2) * radius));
  const result = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  result.computeLineDistances();
  return result;
}
// Unchanged TEMPORARY geometry, not final low-poly character artwork.
export function createTrainingPlaceholder() {
  const group = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.34, 0.65, 4, 10), material('#74c9bc', { metalness: 0.12 }), 0, 0.91, 0);
  group.add(body);
  group.add(mesh(new THREE.CylinderGeometry(0.46, 0.51, 0.15, 16), material('#233e46'), 0, 0.1, 0));
  const facing = mesh(new THREE.ConeGeometry(0.14, 0.38, 3), material('#d0f4d9'), 0, 0.65, 0.52);
  facing.rotation.x = Math.PI / 2;
  group.add(facing);
  const ring = circle(0.56, '#8debd1', 0.95);
  group.add(ring);
  return group;
}

