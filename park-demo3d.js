/* =====================================================================
   SW4 PARK – Interaktive 3D-Übungsvorführung am Rack
   - Szene: die bestehende Rack-Zeichnung (park-rack3d.js, unverändert)
   - Figur: die vorhandene 3D-Figur der App (uebungen3d.js → SW3D.Figure, Gelenk-IK)
   - Ablauf: jede Übung ist eine eigene Definition (park-demos.js), registriert mit
       ParkDemo.register({ id, name, category, muscles, equipment, station, start, setup, reps, build(ctx) })
     build(ctx) liefert { intro:[Phase…], rep:[Phase…], outro:[Phase…], reps }
     Phase = { id, label, dur (s), pose(u) → Pose }   u = 0…1 innerhalb der Phase
     Pose  = Pose-Objekt der App-Figur (pelvis, yaw, pitch, flex, head, hand, elbow, ankle, knee, foot)
             + bar:true → die Stange der Station folgt den Händen
   - Werkzeuge für Definitionen (ctx): Station (Drehpunkt, Richtung), Standposition,
     Gehen, Stange an den Händen, Brustpunkt, Ausgleich der Hüfte.
   Neue Übung = neuer Eintrag in park-demos.js – die Engine bleibt unverändert.
   ===================================================================== */
(function () {
  'use strict';
  const DEMOS = {}, BY_EX = {};
  const tr = (s, v) => (typeof window.T === 'function' ? window.T(s, v) : String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : '')));
  const D2R = Math.PI / 180;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const smooth = t => t * t * (3 - 2 * t);
  const lerpAng = (a, b, t) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;

  /* ---------- Laden (nur beim ersten Öffnen) ---------- */
  const addScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src + ' konnte nicht geladen werden')); document.head.appendChild(s); });
  let _load = null;
  function load() {
    if (_load) return _load;
    _load = (window.THREE ? Promise.resolve() : addScript('three.min.js'))
      .then(() => (window.SW3D && window.SW3D.Figure ? null : addScript('uebungen3d.js')))
      .then(() => (window.SW4Rack ? null : addScript('park-rack3d.js')))
      .catch(e => { _load = null; throw e; });
    return _load;
  }
  const webglOk = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };

  /* ---------- Posen mischen (weiche Übergänge zwischen Phasen) ---------- */
  function lerpPose(a, b, t) {
    if (!a) return b;
    const o = {};
    for (const k of Object.keys(b)) {
      const x = a[k], y = b[k];
      if (typeof y === 'number' && typeof x === 'number') o[k] = k === 'yaw' ? lerpAng(x, y, t) : lerp(x, y, t);
      else if (y && y.isVector3 && x && x.isVector3) o[k] = x.clone().lerp(y, t);
      else if (y && typeof y === 'object' && !y.isVector3 && x && typeof x === 'object' && (y.L || y.R)) o[k] = { L: lerpPose({ v: x.L }, { v: y.L }, t).v, R: lerpPose({ v: x.R }, { v: y.R }, t).v };
      else o[k] = y;
    }
    return o;
  }
  const clonePose = p => lerpPose(p, p, 0);

  /* ---------- Werkzeuge für Übungsdefinitionen ---------- */
  function makeCtx(stage) {
    const T3 = window.THREE, S3 = window.SW3D, V = (x = 0, y = 0, z = 0) => new T3.Vector3(x, y, z);
    const st = stage.st, a = st.dir.clone().setY(0).normalize(), piv = st.pivot.clone();
    const f = a.clone().negate(), yaw = Math.atan2(f.x, f.z) / D2R;
    const lOf = y => V(Math.cos(y * D2R), 0, -Math.sin(y * D2R)), fOf = y => V(Math.sin(y * D2R), 0, Math.cos(y * D2R));
    const l = lOf(yaw), PY = piv.y;
    const hdist = p => Math.hypot(p.x - piv.x, p.z - piv.z);
    const station = {
      pivot: piv, dir: a, f, l, yaw, PY, barLen: st.L,
      ground: (dist, side = 0) => V(piv.x + a.x * dist + l.x * side, 0, piv.z + a.z * dist + l.z * side),
      restPoint: len => piv.clone().addScaledVector(st.restDir.clone().applyAxisAngle(V(0, 1, 0), st.group.rotation.y), len)
    };
    // Punkt auf der Stange in Höhe h (Abstand len vom Drehpunkt)
    const barPoint = (h, len) => { const r = Math.sqrt(Math.max(0, len * len - (h - PY) * (h - PY))); return V(piv.x + a.x * r, h, piv.z + a.z * r); };
    // Standposition: Füße um dist vom Drehpunkt, halbe Spurbreite w, Zehen leicht nach außen
    const stance = (dist, w = .16, toe = 12, y = yaw) => {
      const c = station.ground(dist), ll = lOf(y);
      const ank = s => c.clone().addScaledVector(ll, s * w).setY(S3.DIM.ank);
      const fd = s => fOf(y + s * toe);
      return { ankle: { L: ank(1), R: ank(-1) }, foot: { L: fd(1), R: fd(-1) }, knee: { L: fd(1), R: fd(-1) }, center: c };
    };
    // Brustbein-Punkt vor dem Oberkörper (wo die Stange gehalten wird)
    const chest = (o, fwd = .15, down = .17) => { const K = S3.kin(o); return K.S.clone().addScaledVector(K.u, -down).addScaledVector(K.f, fwd); };
    // Hüfte entlang der Stationsachse verschieben, bis der Brustpunkt auf der Stange liegt
    function fitToBar(o, len, fwd, down, n = 5) {
      let mid = null;
      for (let i = 0; i < n; i++) {
        const c = chest(o, fwd, down); mid = barPoint(c.y, len);
        const d = hdist(mid) - hdist(c);
        o.pelvis = o.pelvis.clone().addScaledVector(a, d);
      }
      return barPoint(chest(o, fwd, down).y, len);
    }
    const around = (mid, w = .04, y = yaw) => { const ll = lOf(y); return { L: mid.clone().addScaledVector(ll, w), R: mid.clone().addScaledVector(ll, -w) }; };
    // hängende Arme (optional mit Armschwung)
    function hang(o, swing = { L: 0, R: 0 }) {
      const K = S3.kin(o), h = {};
      for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
        const sh = K.S.clone().addScaledVector(K.l, s * S3.DIM.shW).addScaledVector(K.u, -.015);
        h[k] = sh.addScaledVector(K.u, -.585).addScaledVector(K.f, .05 + (swing[k] || 0)).addScaledVector(K.l, s * .045);
      }
      return h;
    }
    const elbowsDownOut = (out = .4, fwd = 0, y = yaw) => { const ll = lOf(y), ff = fOf(y); return { L: V(0, -1, 0).addScaledVector(ll, out).addScaledVector(ff, fwd), R: V(0, -1, 0).addScaledVector(ll, -out).addScaledVector(ff, fwd) }; };
    const elbowsBack = (y = yaw) => { const ll = lOf(y), ff = fOf(y); return { L: ff.clone().negate().addScaledVector(ll, .3), R: ff.clone().negate().addScaledVector(ll, -.3) }; };

    /* Gehen: Fußabdrücke von A nach B, am Ende Drehung in die Zielrichtung, Füße in Spurbreite */
    function walk(o) {
      const from = V(o.from.x, 0, o.from.z), to = o.to.clone().setY(0);
      const d = to.clone().sub(from), D = d.length(), dn = D > 1e-6 ? d.clone().divideScalar(D) : f.clone();
      const ty = D > 1e-6 ? Math.atan2(dn.x, dn.z) / D2R : o.yaw;
      const y0 = o.from.yaw != null ? o.from.yaw : ty, y1 = o.yaw != null ? o.yaw : ty;
      const W = o.halfW || .15, toe = o.toe || 10, stp = o.step || .5, wT = o.toeWalk || 5;
      const feet = { L: { pos: from.clone().addScaledVector(lOf(y0), .1), yaw: y0 }, R: { pos: from.clone().addScaledVector(lOf(y0), -.1), yaw: y0 } };
      const start = { L: { ...feet.L, pos: feet.L.pos.clone() }, R: { ...feet.R, pos: feet.R.pos.clone() } };
      const steps = []; let side = 'L', t = 0;
      const push = (s, pos, yy, dur) => { steps.push({ side: s, from: { pos: feet[s].pos.clone(), yaw: feet[s].yaw }, to: { pos, yaw: yy }, t0: t, dur, other: { pos: feet[s === 'L' ? 'R' : 'L'].pos.clone(), yaw: feet[s === 'L' ? 'R' : 'L'].yaw } }); feet[s] = { pos: pos.clone(), yaw: yy }; t += dur; };
      const N = Math.max(1, Math.ceil(D / stp));
      for (let k = 1; k <= N; k++) {
        const yy = k === 1 ? lerpAng(y0, ty, .75) : ty, c = from.clone().addScaledVector(dn, D * k / N);
        push(side, c.addScaledVector(lOf(yy), side === 'L' ? .1 : -.1), yy, .56); side = side === 'L' ? 'R' : 'L';
      }
      const turn = Math.abs(lerpAng(ty, y1, 1) - ty);
      if (turn > 60) { const ym = lerpAng(ty, y1, .5); push(side, to.clone().addScaledVector(lOf(ym), side === 'L' ? W * .8 : -W * .8), ym, .55); side = side === 'L' ? 'R' : 'L'; }
      push(side, to.clone().addScaledVector(lOf(y1), side === 'L' ? W : -W), y1, .6); side = side === 'L' ? 'R' : 'L';
      push(side, to.clone().addScaledVector(lOf(y1), side === 'L' ? W : -W), y1, .6);
      const dur = t, SY = S3.STAND_Y;
      const ftoe = (s, yy, k) => fOf(yy + (s === 'L' ? 1 : -1) * lerp(wT, toe, k));
      return {
        dur,
        pose(u) {
          const tt = clamp(u, 0, 1) * dur;
          let j = steps.findIndex(s => tt < s.t0 + s.dur); if (j < 0) j = steps.length - 1;
          const s = steps[j], v = clamp((tt - s.t0) / s.dur, 0, 1), sv = smooth(v);
          const sw = s.side, stn = sw === 'L' ? 'R' : 'L';
          const moved = s.from.pos.distanceTo(s.to.pos);
          const swPos = s.from.pos.clone().lerp(s.to.pos, sv), swYaw = lerpAng(s.from.yaw, s.to.yaw, sv);
          const lift = Math.sin(Math.PI * v) * (moved > .05 ? .085 : .03);
          const endK = j >= steps.length - 2 ? sv : 0, isEnd = j >= steps.length - 2;
          const P = { [sw]: { pos: swPos, yaw: swYaw }, [stn]: s.other };
          const mid = P.L.pos.clone().add(P.R.pos).multiplyScalar(.5);
          const pyaw = lerpAng(P.L.yaw, P.R.yaw, .5);
          const bob = moved > .05 ? Math.sin(Math.PI * v) * .016 : 0;
          const ll = lOf(pyaw);
          const o = {
            pelvis: mid.clone().addScaledVector(ll, (stn === 'L' ? 1 : -1) * .018 * Math.sin(Math.PI * v)).setY(SY - (isEnd ? lerp(.045, .03, endK) : .045) + bob),
            yaw: pyaw, pitch: 2, flex: 0, head: 0,
            ankle: { [sw]: swPos.clone().setY(S3.DIM.ank + lift), [stn]: s.other.pos.clone().setY(S3.DIM.ank) },
            foot: { [sw]: ftoe(sw, swYaw, isEnd ? 1 : 0), [stn]: ftoe(stn, s.other.yaw, isEnd ? 1 : 0) },
          };
          o.knee = { L: o.foot.L.clone(), R: o.foot.R.clone() };
          // Armschwung gegengleich zu den Beinen
          const ff = fOf(pyaw), off = k => o.ankle[k].clone().sub(o.pelvis).dot(ff);
          o.hand = hang(o, { L: -off('R') * .35, R: -off('L') * .35 });
          o.elbow = elbowsBack(pyaw);
          return o;
        },
        startPose() { return this.pose(0); },
        endFeet: () => start && feet
      };
    }
    return { V, T3, S3, lerp, ease, smooth, clamp, lerpAng, station, barPoint, stance, chest, fitToBar, around, hang, elbowsDownOut, elbowsBack, walk, lOf, fOf, lerpPose };
  }

  /* ---------- Bühne: Renderer, Rack, Figur, Kamera, Zeitachse ---------- */
  class Stage {
    constructor(host, def, opt = {}) {
      const T3 = window.THREE, S3 = window.SW3D;
      this.T3 = T3; this.def = def; this.host = host; this.opt = opt;
      const small = Math.min(innerWidth, innerHeight) < 700 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      this.small = small;
      const R = this.R = new T3.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2));
      R.outputEncoding = T3.sRGBEncoding; R.toneMapping = T3.ACESFilmicToneMapping; R.toneMappingExposure = .9;
      R.shadowMap.enabled = true; R.shadowMap.type = T3.PCFSoftShadowMap; R.physicallyCorrectLights = true;
      R.domElement.className = 'pd3-canvas'; host.appendChild(R.domElement);
      const scene = this.scene = new T3.Scene();
      scene.background = new T3.Color(0x060606); scene.fog = new T3.Fog(0x060606, 8, 18);
      this.rack = window.SW4Rack.build(scene, R, { quality: small ? 'low' : 'mid' });
      this.st = this.rack.stations[def.station];
      if (!this.st) throw new Error('Station fehlt: ' + def.station);
      this.restQ = this.st.bar.quaternion.clone();
      // vorhandene App-Figur
      const MT = S3.mats(); Object.values(MT).forEach(m => { if (m && m.isMaterial) m.envMapIntensity = .35; });
      this.fig = new S3.Figure(scene, MT, opt.fig === 'm' ? 'm' : 'w');
      this.cam = new T3.PerspectiveCamera(40, 1, .05, 60);
      this.ctx = makeCtx(this);
      const plan = def.build.call(def, this.ctx);
      this.reps = plan.reps || def.reps || 3;
      this.list = [];
      (plan.intro || []).forEach(p => this.list.push({ p, blk: 'i' }));
      this.repStart = this.list.length;
      for (let r = 1; r <= this.reps; r++) (plan.rep || []).forEach((p, i) => this.list.push({ p, blk: 'r', r, last: i === plan.rep.length - 1 }));
      (plan.outro || []).forEach(p => this.list.push({ p, blk: 'o' }));
      this.total = this.list.reduce((s, x) => s + x.p.dur, 0);
      // Kamera: seitlich-vorne auf die Station
      const c = this.ctx.station, focus = c.ground(+(def.camera && def.camera.focus) || 1.1).setY(.95);
      // seitlich-hinten: Figur und Rack mit T-Bar gemeinsam im Bild (Übung kann je eigene Kamera vorgeben)
      const cv = def.camera || {}, off = c.l.clone().multiplyScalar(-(cv.side != null ? cv.side : 1)).add(c.dir.clone().multiplyScalar(cv.back != null ? cv.back : .85)).normalize();
      this.orbit = { az: Math.atan2(off.x, off.z), el: cv.el != null ? cv.el : .2, dist: cv.dist || 4.6 };
      this.portraitK = 1.25;
      this.focus = focus; this.target = focus.clone(); this.follow = new T3.Vector3();
      this.loop = opt.loop !== false; this.speed = 1;
      this.reset();
      this._bind(); this.resize();
      this._raf = 0; this._last = 0; this._tick = this._tick.bind(this);
      this._raf = requestAnimationFrame(this._tick);
    }
    reset() { this.idx = 0; this.t = 0; this.loops = 0; this.done = false; this.blendFrom = null; this.blendT = 1; this.lastPose = null; this.playing = true; this.st.bar.quaternion.copy(this.restQ); this._apply(true); this._aim(true); this.dirty = true; }
    _aim(snap, dt = 0) { if (!this.pelvis) return; this.follow.copy(this.pelvis).setY(.95).lerp(this.focus, .55); if (snap) this.target.copy(this.follow); else this.target.lerp(this.follow, 1 - Math.exp(-dt * 2.2)); }
    get cur() { return this.list[this.idx]; }
    elapsed() { let s = 0; for (let i = 0; i < this.idx; i++) s += this.list[i].p.dur; return s + this.t; }
    advance(dt) {
      if (!this.playing || this.done) return;
      this.t += dt * this.speed;
      while (this.t >= this.cur.p.dur) {
        const c = this.cur; this.t -= c.p.dur;
        let n = this.idx + 1;
        if (c.blk === 'r' && c.r === this.reps && c.last && this.loop) { n = this.repStart; this.loops++; }
        if (n >= this.list.length) { this.t = c.p.dur; this.done = true; this.playing = false; break; }
        this.blendFrom = this.lastPose ? clonePose(this.lastPose) : null; this.blendT = 0; this.idx = n;
      }
      this.blendT += dt * this.speed;
    }
    _apply(force) {
      const c = this.cur, u = clamp(this.t / c.p.dur, 0, 1);
      let pose = c.p.pose(u);
      const bar = pose.bar;
      if (this.blendFrom && this.blendT < .28 && !force) pose = lerpPose(this.blendFrom, pose, smooth(this.blendT / .28));
      this.lastPose = pose;
      const J = window.SW3D.solve(pose); this.fig.update(J);
      // Stange folgt den Händen (gleicher Abstand zum Drehpunkt) oder liegt auf dem Boden
      if (bar) {
        const hm = J.L.hand.clone().add(J.R.hand).multiplyScalar(.5), piv = this.st.pivot;
        const dW = hm.sub(piv).normalize(), dL = dW.applyAxisAngle(new this.T3.Vector3(0, 1, 0), -this.st.group.rotation.y);
        this.st.bar.quaternion.setFromUnitVectors(new this.T3.Vector3(0, 1, 0), dL);
      } else this.st.bar.quaternion.copy(this.restQ);
      this.pelvis = J.K.pel;
    }
    // Info für die Oberfläche
    info() {
      const c = this.cur, rep = c.blk === 'r' ? c.r + this.loops * this.reps : 0;
      return { label: c.p.label, rep, reps: this.reps, loop: this.loop, playing: this.playing, done: this.done, progress: this.loop && this.loops ? null : clamp(this.elapsed() / this.total, 0, 1) };
    }
    play() { if (this.done) this.reset(); this.playing = true; this.dirty = true; }
    pause() { this.playing = false; this.dirty = true; }
    replay() { this.reset(); }
    setLoop(v) { this.loop = !!v; }
    seek(sec) { this.reset(); const dt = 1 / 30; let s = 0; while (s < sec && !this.done) { this.advance(dt); this._apply(); s += dt; } this.dirty = true; }
    _tick(now) {
      this._raf = requestAnimationFrame(this._tick);
      const dt = this._last ? Math.min(.1, (now - this._last) / 1000) : 0; this._last = now;
      if (this.playing && !this.done) { this.advance(dt); this._apply(); this.dirty = true; }
      // Kamera folgt der Figur weich (Zielpunkt zwischen Figur und Station)
      if (this.pelvis) { const before = this.target.clone(); this._aim(false, dt); if (before.distanceToSquared(this.target) > 1e-8) this.dirty = true; }
      if (!this.dirty) return;
      const o = this.orbit, ce = Math.cos(o.el), dist = o.dist * (this.cam.aspect < 1 ? this.portraitK : 1);
      this.cam.position.set(this.target.x + Math.sin(o.az) * ce * dist, this.target.y + Math.sin(o.el) * dist, this.target.z + Math.cos(o.az) * ce * dist);
      this.cam.lookAt(this.target); this.R.render(this.scene, this.cam); this.dirty = false;
      if (this.onFrame) this.onFrame(this.info());
    }
    resize() {
      const w = this.host.clientWidth || innerWidth, h = this.host.clientHeight || innerHeight;
      this.R.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 52 : 40; this.cam.updateProjectionMatrix(); this.dirty = true;
    }
    _bind() {
      const el = this.R.domElement, pts = new Map(); let pinch = 0;
      const dn = e => { try { el.setPointerCapture(e.pointerId); } catch (x) {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
      const mv = e => {
        if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { this.orbit.az -= dx * .008; this.orbit.el = clamp(this.orbit.el + dy * .006, -.05, 1.2); }
        else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) this.orbit.dist = clamp(this.orbit.dist * pinch / d, 2.2, 10); pinch = d; }
        this.dirty = true;
      };
      const up = e => { pts.delete(e.pointerId); pinch = 0; };
      const wh = e => { e.preventDefault(); this.orbit.dist = clamp(this.orbit.dist * (1 + Math.sign(e.deltaY) * .08), 2.2, 10); this.dirty = true; };
      el.addEventListener('pointerdown', dn); el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('wheel', wh, { passive: false });
      this._ro = window.ResizeObserver ? new ResizeObserver(() => this.resize()) : null; if (this._ro) this._ro.observe(this.host); else addEventListener('resize', this._rs = () => this.resize());
      this._vis = () => { this._last = 0; }; document.addEventListener('visibilitychange', this._vis);
    }
    dispose() {
      cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); if (this._rs) removeEventListener('resize', this._rs);
      document.removeEventListener('visibilitychange', this._vis);
      this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => { if (x.map) x.map.dispose(); if (x.bumpMap) x.bumpMap.dispose(); x.dispose(); }); });
      if (this.scene.environment) this.scene.environment.dispose();
      this.R.dispose(); try { this.R.forceContextLoss(); } catch (e) {} this.R.domElement.remove();
    }
  }

  /* ---------- Oberfläche (Vollbild über der Übungsbeschreibung) ---------- */
  const IC = {
    back: '<path d="M15 18l-6-6 6-6"/>', play: '<path d="M7 5v14l11-7z" fill="currentColor" stroke="none"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'
  };
  const svg = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
  const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let UIst = null;

  function css() {
    if (document.getElementById('pd3-css')) return;
    const s = document.createElement('style'); s.id = 'pd3-css';
    s.textContent = `
    .pd3{position:fixed;inset:0;z-index:9000;background:#060606;color:#f2efe9;display:flex;flex-direction:column;font-family:inherit;overscroll-behavior:contain}
    .pd3-stage{position:absolute;inset:0}.pd3-canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
    .pd3-top{position:relative;z-index:2;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 10px;background:linear-gradient(#060606e6,#06060600)}
    .pd3-back{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px 0 10px;border-radius:999px;border:1px solid #ffffff22;background:#141414cc;color:#f2efe9;font:inherit;font-size:14px;font-weight:700;cursor:pointer;backdrop-filter:blur(8px)}
    .pd3-title{min-width:0;flex:1}.pd3-title b{display:block;font-size:16px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pd3-title span{font-size:12px;color:#a59f95}
    .pd3-info{position:absolute;z-index:2;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 92px);display:flex;justify-content:center;pointer-events:none}
    .pd3-phase{max-width:560px;text-align:center;font-size:15px;font-weight:700;line-height:1.35;background:#0b0b0bcc;border:1px solid #ffffff1a;border-radius:14px;padding:8px 14px;backdrop-filter:blur(8px)}
    .pd3-phase small{display:block;color:#be9b5c;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
    .pd3-bar{position:absolute;z-index:2;left:0;right:0;bottom:0;padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 12px);background:linear-gradient(#06060600,#060606f0 40%)}
    .pd3-prog{height:4px;border-radius:4px;background:#ffffff1f;overflow:hidden;margin:0 4px 10px}.pd3-prog i{display:block;height:100%;width:0;background:#be9b5c;transition:width .2s linear}
    .pd3-btns{display:flex;gap:10px;justify-content:center}
    .pd3-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;min-width:48px;padding:0 16px;border-radius:14px;border:1px solid #ffffff22;background:#161616;color:#f2efe9;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
    .pd3-btn.main{background:#be9b5c;color:#111;border-color:#be9b5c;min-width:120px}
    .pd3-btn[aria-pressed="true"]{border-color:#be9b5c;color:#be9b5c}
    .pd3-hint{position:absolute;z-index:2;top:calc(env(safe-area-inset-top,0px) + 66px);left:0;right:0;text-align:center;font-size:12px;color:#a59f95;pointer-events:none;transition:opacity .6s}
    .pd3-msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px;color:#a59f95}
    .pd3-msg b{color:#f2efe9;font-size:16px}
    @media (max-height:520px){.pd3-info{bottom:auto;top:calc(env(safe-area-inset-top,0px) + 62px);justify-content:flex-end}.pd3-phase{font-size:13px;max-width:46%}.pd3-hint{display:none}.pd3-btn{min-height:40px}}
    @media (max-width:440px){.pd3-btns{gap:8px}.pd3-btn{flex:1;flex-direction:column;gap:2px;min-height:56px;padding:6px 4px;font-size:12px;min-width:0}.pd3-btn.main{min-width:0}}`;
    document.head.appendChild(s);
  }

  async function open(exId, opt = {}) {
    const def = BY_EX[exId] || DEMOS[exId]; if (!def) return false;
    if (UIst) close(true);
    css();
    const root = document.createElement('div'); root.className = 'pd3'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', tr('3D-Vorführung') + ': ' + tr(def.name));
    root.innerHTML = `<div class="pd3-stage"><div class="pd3-msg" id="pd3-msg"><b>${escH(tr('3D-Vorführung wird geladen …'))}</b></div></div>
      <div class="pd3-top"><button class="pd3-back" data-pd="close">${svg('back', 18)} ${escH(tr('Zur Übungsbeschreibung'))}</button>
        <div class="pd3-title"><b>${escH(tr(def.name))}</b><span>${escH(tr(def.equipShort || def.equipment || ''))}</span></div></div>
      <div class="pd3-hint" id="pd3-hint">${escH(tr('Ziehen zum Drehen · zwei Finger zum Zoomen'))}</div>
      <div class="pd3-info"><div class="pd3-phase" id="pd3-phase" aria-live="polite"></div></div>
      <div class="pd3-bar"><div class="pd3-prog"><i id="pd3-prog"></i></div><div class="pd3-btns">
        <button class="pd3-btn main" data-pd="play" id="pd3-play"></button>
        <button class="pd3-btn" data-pd="replay" aria-label="${escH(tr('Erneut abspielen'))}">${svg('replay')} <span>${escH(tr('Erneut abspielen'))}</span></button>
        <button class="pd3-btn" data-pd="loop" id="pd3-loop" aria-pressed="true" aria-label="${escH(tr('Schleife'))}">${svg('loop')} <span>${escH(tr('Schleife'))}</span></button>
      </div></div>`;
    document.body.appendChild(root);
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const state = UIst = { root, def, stage: null, prevOverflow, pushed: false };
    try { history.pushState(Object.assign({}, history.state || {}, { pd3: true }), '', location.href); state.pushed = true; } catch (e) {}
    state.onPop = () => { if (UIst === state) { state.pushed = false; close(true); } };
    addEventListener('popstate', state.onPop);
    state.onKey = e => { if (e.key === 'Escape') close(); else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); toggle(); } };
    addEventListener('keydown', state.onKey);
    const $ = id => root.querySelector('#' + id);
    const toggle = () => { const s = state.stage; if (!s) return; s.playing ? s.pause() : s.play(); sync(s.info()); };
    const sync = i => {
      $('pd3-play').innerHTML = i.playing ? `${svg('pause')} <span>${escH(tr('Pause'))}</span>` : `${svg('play')} <span>${escH(tr(i.done ? 'Nochmal' : 'Start'))}</span>`;
      $('pd3-play').setAttribute('aria-label', tr(i.playing ? 'Animation pausieren' : 'Animation starten'));
      $('pd3-loop').setAttribute('aria-pressed', i.loop ? 'true' : 'false');
      const ph = `${i.rep ? `<small>${escH(tr('Wiederholung {n}', { n: i.rep }))}${i.loop ? '' : ' / ' + i.reps}</small>` : ''}${escH(tr(i.label))}`;
      if (state._ph !== ph) { $('pd3-phase').innerHTML = ph; state._ph = ph; }
      $('pd3-prog').style.width = i.progress == null ? '100%' : (i.progress * 100).toFixed(1) + '%';
    };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-pd]'); if (!b) return; const s = state.stage, k = b.dataset.pd;
      if (k === 'close') return close();
      if (!s) return;
      if (k === 'play') toggle();
      else if (k === 'replay') { s.replay(); s.play(); }
      else if (k === 'loop') s.setLoop(!s.loop);
      sync(s.info());
    });
    setTimeout(() => { const h = $('pd3-hint'); if (h) h.style.opacity = '0'; }, 4500);
    if (!webglOk()) { $('pd3-msg').innerHTML = `<b>${escH(tr('3D wird auf diesem Gerät nicht unterstützt.'))}</b><span>${escH(tr('Die Übungsbeschreibung steht dir weiterhin zur Verfügung.'))}</span>`; return true; }
    try {
      await load();
      if (UIst !== state) return true;
      const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const s = state.stage = new Stage(root.querySelector('.pd3-stage'), def, { fig: opt.fig || def.fig || 'w', loop: opt.loop !== false });
      $('pd3-msg').remove();
      s.onFrame = sync; if (reduced && !opt.autoplay) s.pause(); sync(s.info());
      window.ParkDemo.current = s;
    } catch (err) {
      console.error(err);
      const m = $('pd3-msg'); if (m) m.innerHTML = `<b>${escH(tr('Die 3D-Vorführung konnte nicht geladen werden.'))}</b><span>${escH(err && err.message || err)}</span>`;
    }
    return true;
  }
  function close(silent) {
    const s = UIst; if (!s) return;
    if (!silent && s.pushed) { s.pushed = false; UIst = s; removeEventListener('popstate', s.onPop); try { history.back(); } catch (e) {} }
    UIst = null;
    removeEventListener('popstate', s.onPop); removeEventListener('keydown', s.onKey);
    if (s.stage) s.stage.dispose(); s.root.remove(); document.body.style.overflow = s.prevOverflow || '';
    window.ParkDemo.current = null;
    if (typeof s.def.onClose === 'function') s.def.onClose();
  }

  /* ---------- Rack-Ansicht (nur Rack, drehbar) – z. B. auf der Programm-Seite ---------- */
  let _loadRack = null;
  function loadRack() {
    if (_loadRack) return _loadRack;
    _loadRack = (window.THREE ? Promise.resolve() : addScript('three.min.js'))
      .then(() => (window.SW4Rack ? null : addScript('park-rack3d.js')))
      .catch(e => { _loadRack = null; throw e; });
    return _loadRack;
  }
  let RV = null;
  class RackView {
    constructor(host) {
      const T3 = window.THREE; this.T3 = T3; this.host = host;
      const small = Math.min(innerWidth, innerHeight) < 700 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const R = this.R = new T3.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2));
      R.outputEncoding = T3.sRGBEncoding; R.toneMapping = T3.ACESFilmicToneMapping; R.toneMappingExposure = .9;
      R.shadowMap.enabled = true; R.shadowMap.type = T3.PCFSoftShadowMap; R.physicallyCorrectLights = true;
      R.domElement.className = 'park-r3-canvas'; host.appendChild(R.domElement);
      const scene = this.scene = new T3.Scene(); scene.background = new T3.Color(0x060606); scene.fog = new T3.Fog(0x060606, 9, 20);
      this.rack = window.SW4Rack.build(scene, R, { quality: small ? 'low' : 'mid' });
      this.cam = new T3.PerspectiveCamera(38, 1.6, .05, 60);
      this.target = new T3.Vector3(0, 1.0, .5);
      this.orbit = { az: .55, el: .2, dist: 7.6 }; this.auto = 0; this.visible = true; this.dirty = true;
      const el = R.domElement, pts = new Map(); let pinch = 0, sx = 0, sy = 0;
      el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch (x) {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); sx = e.clientX; sy = e.clientY; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
      el.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { this.orbit.az -= dx * .008; this.orbit.el = clamp(this.orbit.el + dy * .005, 0, 1.1); }
        else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) this.orbit.dist = clamp(this.orbit.dist * pinch / d, 3.5, 12); pinch = d; }
        this.auto = 5; this.dirty = true;
      });
      const up = e => { pts.delete(e.pointerId); pinch = 0; };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      // vertikales Wischen soll die Seite scrollen, horizontales Wischen dreht das Rack
      el.style.touchAction = 'pan-y';
      el.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); this.orbit.dist = clamp(this.orbit.dist * (1 + Math.sign(e.deltaY) * .08), 3.5, 12); this.dirty = true; }, { passive: false });
      this._io = window.IntersectionObserver ? new IntersectionObserver(es => { this.visible = es[0].isIntersecting; this._last = 0; }) : null; if (this._io) this._io.observe(host);
      this._ro = window.ResizeObserver ? new ResizeObserver(() => this.resize()) : null; if (this._ro) this._ro.observe(host);
      this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.resize(); this._last = 0; this._tick = this._tick.bind(this); this._raf = requestAnimationFrame(this._tick);
    }
    resize() { const w = this.host.clientWidth || 320, h = this.host.clientHeight || 200; this.R.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.dirty = true; }
    _tick(now) {
      if (!this.host.isConnected) return this.dispose();
      this._raf = requestAnimationFrame(this._tick);
      const dt = this._last ? Math.min(.1, (now - this._last) / 1000) : 0; this._last = now;
      if (!this.visible || document.hidden) return;
      if (this.auto > 0) this.auto -= dt; else if (!this.reduced) { this.orbit.az += dt * .14; this.dirty = true; }
      if (!this.dirty) return;
      const o = this.orbit, ce = Math.cos(o.el), d = o.dist * (this.cam.aspect < 1.2 ? 1.25 : 1);
      this.cam.position.set(this.target.x + Math.sin(o.az) * ce * d, this.target.y + Math.sin(o.el) * d, this.target.z + Math.cos(o.az) * ce * d);
      this.cam.lookAt(this.target); this.R.render(this.scene, this.cam); this.dirty = false;
      if (!this.shown) { this.shown = true; this.host.classList.add('ready'); }
    }
    dispose() {
      cancelAnimationFrame(this._raf); if (this._io) this._io.disconnect(); if (this._ro) this._ro.disconnect();
      this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => { if (x.map) x.map.dispose(); if (x.bumpMap) x.bumpMap.dispose(); x.dispose(); }); });
      if (this.scene.environment) this.scene.environment.dispose();
      this.R.dispose(); try { this.R.forceContextLoss(); } catch (e) {} this.R.domElement.remove();
      if (RV === this) { RV = null; window.ParkDemo.rackView = null; }
    }
  }
  async function mountRack(host) {
    if (!host || host.dataset.r3) return null;
    host.dataset.r3 = '1';
    if (RV) RV.dispose();
    if (!webglOk()) { host.classList.add('nogl'); return null; }
    try { await loadRack(); } catch (e) { console.error(e); host.classList.add('nogl'); return null; }
    if (!host.isConnected) return null;
    RV = new RackView(host); window.ParkDemo.rackView = RV;
    return RV;
  }

  window.ParkDemo = {
    register(def) { DEMOS[def.id] = def; (def.exercises || [def.id]).forEach(x => { BY_EX[x] = def; }); return def; },
    has: exId => !!(BY_EX[exId] || DEMOS[exId]),
    get: exId => BY_EX[exId] || DEMOS[exId] || null,
    list: () => Object.values(DEMOS),
    open, close, load, Stage, makeCtx, lerpPose, mountRack, loadRack, rackView: null,
    isOpen: () => !!UIst, current: null, version: 1
  };
})();
