/* <three-d-stage> — сцена three.js для 3D-фрагмента фасада.
   Рендерер, студийный свет с мягкой тенью, орбитальная камера, подгонка
   под размер элемента и экспорт в OBJ + MTL / GLB.
   Кадр рисуется только по требованию: при движении камеры, затухании
   инерции, ресайзе или смене материалов — без постоянного цикла.
   three.js подключается через import map страницы (vendor/three/). */
(() => {
  const stylesheet = `
    :host{position:relative;display:block;width:100%;height:100%;background:var(--stage-bg,#EAE2D4);overflow:hidden}
    canvas{display:block;outline:none;touch-action:none}
    .toolbar{position:absolute;right:16px;bottom:16px;display:flex;gap:8px;font-family:'Manrope',system-ui,sans-serif}
    .toolbar button{appearance:none;border:1px solid rgba(26,24,21,.16);border-radius:999px;background:rgba(249,245,236,.94);color:#1A1815;font:600 12.5px/1 'Manrope',system-ui,sans-serif;padding:11px 15px;cursor:pointer;transition:background .3s ease,border-color .3s ease}
    .toolbar button:hover{background:#fff;border-color:#C9A97E}
    .toolbar button:focus-visible{outline:2px solid #7A5C33;outline-offset:2px}
    .toolbar button[disabled]{opacity:.5;pointer-events:none}
    .err{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:24px;font:500 14px/1.6 'Manrope',system-ui,sans-serif;color:#4C463C;text-align:center;white-space:pre-line}
  `;

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  class ThreeDStage extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = stylesheet;
      root.appendChild(style);
      this._err = document.createElement('div');
      this._err.className = 'err';
      this._err.setAttribute('role', 'alert');
      root.appendChild(this._err);
      this._toolbar = document.createElement('div');
      this._toolbar.className = 'toolbar';
      this._objBtn = document.createElement('button');
      this._objBtn.type = 'button';
      this._objBtn.textContent = this.getAttribute('obj-label') || 'Скачать OBJ + MTL';
      this._objBtn.addEventListener('click', () => this._exportObj());
      this._glbBtn = document.createElement('button');
      this._glbBtn.type = 'button';
      this._glbBtn.textContent = this.getAttribute('glb-label') || 'Скачать GLB';
      this._glbBtn.addEventListener('click', () => this._exportGlb());
      this._toolbar.append(this._objBtn, this._glbBtn);
      if (this.hasAttribute('bare')) this._toolbar.style.display = 'none';
      root.appendChild(this._toolbar);
      this._setButtonsEnabled(false);
      this._pending = false;
      /** { THREE } — когда сцена готова; модель строится после await stage.ready */
      this.ready = new Promise((resolve, reject) => { this._readyResolve = resolve; this._readyReject = reject; });
    }

    connectedCallback() {
      if (this._booted) { if (this._ro) this._ro.observe(this); this.render(); return; }
      this._booted = true;
      this._boot().catch((err) => {
        this._err.style.display = 'flex';
        this._err.textContent = 'Не удалось загрузить 3D-модель.\nОбновите страницу или посмотрите рендеры фасада на главной.';
        this._readyReject(err);
      });
    }

    async _boot() {
      const bg = this.getAttribute('background');
      if (bg) this.style.setProperty('--stage-bg', bg);
      const [THREE, controlsMod] = await Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]);
      this._THREE = THREE;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      this._renderer = renderer;
      this.shadowRoot.insertBefore(renderer.domElement, this._err);

      const scene = new THREE.Scene();
      this._scene = scene;
      const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
      camera.position.set(3, 2.2, 4);
      this._camera = camera;
      const controls = new controlsMod.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      controls.dampingFactor = 0.08;
      this._controls = controls;

      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.0));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(4, 7, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.bias = -0.0002;
      this._key = key;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff4e6, 0.5);
      fill.position.set(-5, 3, -4);
      scene.add(fill);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.18 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this._ground = ground;
      scene.add(ground);

      const fit = () => {
        const w = this.clientWidth || 1, h = this.clientHeight || 1;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        this.render();
      };
      fit();
      this._ro = new ResizeObserver(fit);
      if (this.isConnected) this._ro.observe(this);
      controls.addEventListener('change', () => this.render());
      this._readyResolve({ THREE });
    }

    /** Один кадр на ближайший requestAnimationFrame; пока камера
     *  продолжает движение по инерции, запрашивает следующий. */
    render() {
      if (!this._renderer || this._pending) return;
      this._pending = true;
      requestAnimationFrame(() => {
        this._pending = false;
        const moving = this._controls.update();
        this._renderer.render(this._scene, this._camera);
        if (moving) this.render();
      });
    }

    disconnectedCallback() { if (this._ro) this._ro.disconnect(); }

    /** Показывает объект: тени на всех мешах, объект на земле, камера по габаритам. */
    setObject(object) {
      const THREE = this._THREE;
      if (!THREE) throw new Error('three-d-stage: сцена не готова — дождитесь stage.ready');
      if (this._object) this._scene.remove(this._object);
      this._object = object;
      object.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      const box = new THREE.Box3().setFromObject(object);
      if (!box.isEmpty()) {
        this._ground.position.y = box.min.y;
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const dist = (sphere.radius / Math.tan((this._camera.fov * Math.PI) / 360)) * 1.35;
        const dir = new THREE.Vector3(1, 0.55, 1.25).normalize();
        this._camera.position.copy(sphere.center).add(dir.multiplyScalar(dist));
        this._camera.near = Math.max(dist / 100, 0.01);
        this._camera.far = dist * 100;
        this._camera.updateProjectionMatrix();
        this._controls.target.copy(sphere.center);
        this._controls.update();
        const span = sphere.radius * 3;
        Object.assign(this._key.shadow.camera, { left: -span, right: span, top: span, bottom: -span });
        this._key.shadow.camera.updateProjectionMatrix();
      }
      this._scene.add(object);
      this._setButtonsEnabled(true);
      this.render();
    }

    get _basename() { return (this.getAttribute('name') || 'model').replace(/[^\w.-]+/g, '_'); }
    _setButtonsEnabled(on) { this._objBtn.disabled = !on; this._glbBtn.disabled = !on; }

    /** Уникальные имена мешей и материалов для строк o / usemtl в OBJ. */
    _nameParts() {
      const mats = [], seen = new Set();
      let meshI = 0, matI = 0;
      this._object.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.name) o.name = 'part_' + meshI;
        meshI += 1;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (!m || mats.includes(m)) continue;
          if (!m.name) { m.name = 'mat_' + matI; matI += 1; }
          while (seen.has(m.name)) { m.name = m.name + '_' + matI; matI += 1; }
          seen.add(m.name);
          mats.push(m);
        }
      });
      return mats;
    }

    async _exportObj() {
      if (!this._object) return;
      const mod = await import('three/addons/exporters/OBJExporter.js');
      const mats = this._nameParts();
      const base = this._basename;
      const obj = 'mtllib ' + base + '.mtl\n' + new mod.OBJExporter().parse(this._object);
      let mtl = '# MEGA KHUJAND facade fragment\n';
      for (const m of mats) {
        const c = m.color || { r: 0.8, g: 0.8, b: 0.8 };
        const rough = typeof m.roughness === 'number' ? m.roughness : 0.5;
        const opacity = typeof m.opacity === 'number' ? m.opacity : 1;
        mtl += 'newmtl ' + m.name + '\nKd ' + c.r.toFixed(4) + ' ' + c.g.toFixed(4) + ' ' + c.b.toFixed(4) +
          '\nKs 0.2000 0.2000 0.2000\nNs ' + Math.round((1 - rough) * 200) + '\nd ' + opacity.toFixed(4) + '\n\n';
      }
      download(new Blob([obj], { type: 'text/plain' }), base + '.obj');
      download(new Blob([mtl], { type: 'text/plain' }), base + '.mtl');
    }

    async _exportGlb() {
      if (!this._object) return;
      const mod = await import('three/addons/exporters/GLTFExporter.js');
      this._nameParts();
      const buf = await new mod.GLTFExporter().parseAsync(this._object, { binary: true });
      download(new Blob([buf], { type: 'model/gltf-binary' }), this._basename + '.glb');
    }
  }

  customElements.define('three-d-stage', ThreeDStage);
})();
