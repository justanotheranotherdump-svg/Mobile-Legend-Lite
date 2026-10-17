import * as THREE from 'three';

// A presentation adapter. All meshes below are TEMPORARY test geometry.
// Hero visuals are injected; model replacement never changes simulation entities.
export class WorldView {
  constructor(canvas, arena, enemies, heroVisual) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#101b24');
    this.scene.fog = new THREE.Fog('#101b24', 48, 88);
    this.camera = new THREE.OrthographicCamera(-18, 18, 12, -12, 0.1, 120);
    this.raycaster = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.pointerGround = new THREE.Vector3();
    this.aim = null;
    this.lastHitSerial = 0;
    this.beamUntil = -1;

    this.scene.add(new THREE.HemisphereLight('#c1e1ed', '#33443a', 2.0));
    const sunlight = new THREE.DirectionalLight('#fff0d4', 3.0);
    sunlight.position.set(-8, 22, 10);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunlight.shadow.camera, { left: -23, right: 23, top: 23, bottom: -23, near: 1, far: 65 });
    sunlight.shadow.normalBias = 0.035;
    sunlight.shadow.bias = -0.0002;
    this.scene.add(sunlight);
    this.makeArena(arena);
    this.heroVisual = heroVisual;
    this.hero = heroVisual.root;
    this.scene.add(this.hero);
    this.dummies = new Map(enemies.map(enemy => {
      const model = this.makeDummy();
      model.userData.enemyId = enemy.id;
      return [enemy.id, model];
    }));
    this.selectionRing = this.circle(1.12, '#ffde87', 1);
    this.scene.add(this.selectionRing);
    this.rangeRing = this.circle(6, '#7cb8a3', 0.24, true);
    this.scene.add(this.rangeRing);
    this.aimMarker = new THREE.Group();
    this.aimMarker.add(this.circle(0.27, '#a7f2db', 0.95));
    const cross = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.43, 0.035, 0), new THREE.Vector3(-0.16, 0.035, 0),
      new THREE.Vector3(0.16, 0.035, 0), new THREE.Vector3(0.43, 0.035, 0),
      new THREE.Vector3(0, 0.035, -0.43), new THREE.Vector3(0, 0.035, -0.16),
      new THREE.Vector3(0, 0.035, 0.16), new THREE.Vector3(0, 0.035, 0.43),
    ]), new THREE.LineBasicMaterial({ color: '#b1f5dd', transparent: true, opacity: 0.8 }));
    this.aimMarker.add(cross);
    this.scene.add(this.aimMarker);
    this.beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#bbffe2', transparent: true, opacity: 0.9 }));
    this.scene.add(this.beam);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  material(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }); }
  mesh(geometry, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  box(width, height, depth, color, x, y, z) {
    return this.mesh(new THREE.BoxGeometry(width, height, depth), this.material(color), x, y, z);
  }
  circle(radius, color, opacity = 1, dashed = false) {
    const points = Array.from({ length: 129 }, (_, i) => {
      const angle = i / 128 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * radius, 0.035, Math.sin(angle) * radius);
    });
    const options = { color, transparent: true, opacity, depthWrite: false };
    const material = dashed ? new THREE.LineDashedMaterial({ ...options, dashSize: 0.22, gapSize: 0.13 }) : new THREE.LineBasicMaterial(options);
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    ring.computeLineDistances();
    return ring;
  }

  makeArena(arena) {
    const size = arena.halfSize * 2;
    this.scene.add(this.box(size + 0.8, 0.65, size + 0.8, '#263b3a', 0, -0.38, 0));
    // Instanced tiles are only the test arena floor, not substitute character art.
    const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(2.96, 0.12, 2.96), this.material('#557062'), 100);
    const matrix = new THREE.Matrix4();
    const colors = ['#526658', '#566b5c', '#506456', '#5b6f5e'];
    let index = 0;
    for (let x = 0; x < 10; x++) for (let z = 0; z < 10; z++) {
      matrix.makeTranslation(-13.5 + x * 3, -0.06, -13.5 + z * 3);
      tiles.setMatrixAt(index, matrix);
      tiles.setColorAt(index++, new THREE.Color(colors[(x * 7 + z * 3) % colors.length]));
    }
    tiles.receiveShadow = true;
    this.scene.add(tiles);
    for (const sign of [-1, 1]) {
      this.scene.add(this.box(size + 0.6, 0.65, 0.5, '#314b49', 0, 0.23, sign * (arena.halfSize + 0.25)));
      this.scene.add(this.box(0.5, 0.65, size, '#314b49', sign * (arena.halfSize + 0.25), 0.23, 0));
      this.scene.add(this.box(size, 0.025, 0.045, '#6e9e8c', 0, 0.025, sign * (arena.halfSize - 0.08)));
      this.scene.add(this.box(0.045, 0.025, size, '#6e9e8c', sign * (arena.halfSize - 0.08), 0.025, 0));
    }
    arena.obstacles.forEach(box => {
      this.scene.add(this.box(box.width, box.height, box.depth, '#394f51', box.x, box.height / 2, box.z));
      this.scene.add(this.box(box.width + 0.03, 0.07, box.depth + 0.03, '#728979', box.x, box.height + 0.025, box.z));
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(box.width, box.height, box.depth)), new THREE.LineBasicMaterial({ color: '#9bb19c', transparent: true, opacity: 0.2 }));
      outline.position.set(box.x, box.height / 2, box.z);
      this.scene.add(outline);
    });
    const origin = this.circle(1.6, '#9bbfaa', 0.2);
    this.scene.add(origin);
    const originSmall = this.circle(1.4, '#9bbfaa', 0.15);
    this.scene.add(originSmall);
  }

  makeDummy() {
    const group = new THREE.Group();
    group.add(this.mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.18, 16), this.material('#745e51'), 0, 0.1, 0));
    group.add(this.mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 8), this.material('#ab8c6c'), 0, 0.82, 0));
    const target = new THREE.Group();
    target.position.y = 1.45;
    target.rotation.y = Math.PI / 4;
    const board = this.mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.22, 16), this.material('#d39175'));
    board.rotation.x = Math.PI / 2;
    target.add(board);
    const bullseye = this.mesh(new THREE.TorusGeometry(0.34, 0.055, 6, 24), this.material('#ffe0b4'), 0, 0, 0.14);
    target.add(bullseye);
    target.add(this.mesh(new THREE.SphereGeometry(0.105, 8, 6), this.material('#613d37'), 0, 0, 0.14));
    group.add(target);
    group.add(this.circle(0.9, '#e8a38a', 0.55));
    this.scene.add(group);
    return group;
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.renderer.setSize(this.width, this.height, false);
    const aspect = this.width / Math.max(1, this.height);
    const vertical = Math.max(23, 26 / aspect);
    this.camera.left = -vertical * aspect / 2;
    this.camera.right = vertical * aspect / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
  }

  updateCamera(player) {
    this.camera.position.set(player.x + 18, 24, player.z + 18);
    this.camera.lookAt(player.x, 0, player.z);
    this.camera.updateMatrixWorld();
  }

  pickTarget(pointer) {
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(pointer, this.camera);
    const hit = this.raycaster.intersectObjects([...this.dummies.values()], true).find(hit => hit.object.isMesh);
    if (!hit) return null;
    let object = hit.object;
    while (object && !object.userData.enemyId) object = object.parent;
    return object?.userData.enemyId ?? null;
  }

  project(x, y, z) {
    const point = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (point.x + 1) * this.width / 2, y: (1 - point.y) * this.height / 2, visible: Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.96 && Math.abs(point.z) < 1 };
  }

  resetFeedback() { this.lastHitSerial = 0; this.beamUntil = -1; }

  render(state, pointer) {
    const { player, enemies } = state;
    this.hero.position.set(player.x, 0, player.z);
    for (const enemy of enemies) {
      const model = this.dummies.get(enemy.id);
      model.position.set(enemy.x, 0, enemy.z);
      model.scale.y = enemy.hp > 0 ? 1 : 0.2;
    }
    this.selectionRing.visible = Boolean(state.selectedTarget);
    if (state.selectedTarget) this.selectionRing.position.set(state.selectedTarget.x, 0.025, state.selectedTarget.z);
    this.rangeRing.scale.setScalar(player.range / 6);
    this.rangeRing.position.set(player.x, 0, player.z);
    this.updateCamera(player);
    this.aim = null;
    if (pointer.active) {
      this.raycaster.setFromCamera(pointer, this.camera);
      if (this.raycaster.ray.intersectPlane(this.ground, this.pointerGround)) {
        this.aim = { x: this.pointerGround.x, z: this.pointerGround.z };
        this.aimMarker.position.copy(this.pointerGround);
        this.hero.rotation.y = Math.atan2(this.pointerGround.x - player.x, this.pointerGround.z - player.z);
      }
    }
    this.aimMarker.visible = Boolean(this.aim);
    if (state.lastAttack.serial !== this.lastHitSerial) {
      this.lastHitSerial = state.lastAttack.serial;
      if (state.lastAttack.reason === 'hit') { this.beamUntil = state.time + 0.14; this.beamTargetId = state.lastAttack.targetId; this.heroVisual.play('basicAttack', true); }
    }
    this.beam.visible = state.time < this.beamUntil;
    if (this.beam.visible) {
      const positions = this.beam.geometry.attributes.position;
      positions.setXYZ(0, player.x, 1.05, player.z);
      const hitTarget = enemies.find(enemy => enemy.id === this.beamTargetId);
      positions.setXYZ(1, hitTarget.x, 1.4, hitTarget.z);
      positions.needsUpdate = true;
      this.beam.geometry.computeBoundingSphere();
    }
    this.heroVisual.update(Math.max(0, Math.min(state.time - (this.lastVisualTime ?? state.time), 0.1)),
      Math.hypot(player.x - (this.lastPlayerX ?? player.x), player.z - (this.lastPlayerZ ?? player.z)) > 0.0001 ? 'move' : 'idle');
    this.lastVisualTime = state.time; this.lastPlayerX = player.x; this.lastPlayerZ = player.z;
    this.renderer.render(this.scene, this.camera);
  }
}
