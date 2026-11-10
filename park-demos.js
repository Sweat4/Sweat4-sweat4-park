/* =====================================================================
   SW4 PARK – Übungsdefinitionen für die 3D-Vorführung am Rack
   Eine Übung = ein Eintrag. Die Engine (park-demo3d.js) und das Rack bleiben unverändert.

   Felder:
     id          Übungs-ID (gleich wie in park-katalog.js)
     name, category, muscles {prim, sec}, equipment
     station     Rack-Position: 'tbarL' | 'tbarR' (T-Bar-Halterungen; weitere folgen)
     start       Startposition der Figur in der Szene {x, z, yaw}
     setup       Ausgangsposition (Abstände in m, Spurbreite, Zehenwinkel)
     reps        Wiederholungen pro Durchgang (Schleife wiederholt nur die Wiederholungen)
     build(ctx)  Bewegungsablauf → { intro, rep, outro } aus Phasen {id, label, dur, pose(u)}

   NEUE ÜBUNG: Eintrag kopieren, station/setup/Phasen anpassen, in park-katalog.js die
   Übung mit derselben id anlegen. Fertig – die App zeigt die Vorführung automatisch.
   ===================================================================== */
(function () {
  if (!window.ParkDemo) return;

  /* ---------- Front-Kniebeuge mit der T-Bar (Landmine Front Squat) ---------- */
  ParkDemo.register({
    id: 'tbar-front-squat',
    name: 'Front-Kniebeuge mit der T-Bar',
    category: 'Beine · Quadrizeps · Gesäß · Grundübung',
    muscles: { prim: ['quads', 'glutes'], sec: ['adductors', 'abs', 'lowerBack', 'upperBack'] },
    equipment: 'T-Bar am Sweat4 Rack · Olympia-Stange mit 20-kg-Scheibe',
    equipShort: 'T-Bar · Sweat4 Rack',
    station: 'tbarL',                         // linke T-Bar-Halterung (vorne am mittleren Pfosten)
    start: { x: 0.35, z: 4.6, yaw: 200 },     // neutrale Position vor dem Rack
    setup: {
      pickDist: 2.32,      // Füße beim Aufnehmen: Abstand zum Drehpunkt (m)
      workDist: 2.12,      // Füße in der Ausgangsposition (m)
      halfW: 0.165,        // halbe Spurbreite → Füße etwa schulterbreit
      toe: 14,             // Zehen leicht nach außen (°)
      grip: 2.16,          // Griff: Hände am Ende der Stange (Abstand zum Drehpunkt, Stange 2,20 m)
      hold: 0.82,          // Höhe der Hände beim Herantreten (m)
      depth: 0.47          // Hüftgelenk im tiefsten Punkt (m) – Oberschenkel etwa parallel zum Boden
    },
    reps: 3,
    build(ctx) {
      const s = this.setup, st = ctx.station, V = ctx.V, SY = ctx.S3.STAND_Y, L = ctx.lerp, E = ctx.ease;
      const pick = ctx.stance(s.pickDist, s.halfW, s.toe), work = ctx.stance(s.workDist, s.halfW, s.toe);
      const base = (stn, o) => Object.assign({ yaw: st.yaw, pitch: 2, flex: 0, roll: 0, head: 0, ankle: stn.ankle, foot: stn.foot, knee: stn.knee }, o);
      const standPick = () => { const o = base(pick, { pelvis: pick.center.clone().setY(SY - .03) }); o.hand = ctx.hang(o); o.elbow = ctx.elbowsBack(); return o; };
      const grip = ctx.station.restPoint(s.grip);                // Ende der Stange, solange die Scheibe am Boden liegt

      // Front-Kniebeuge: d = 0 oben … 1 tiefster Punkt. Füße fest, Hüfte nach hinten/unten,
      // Oberkörper aufrecht, Stange vor dem Brustbein (Hüfte wird so ausgeglichen, dass die Hände auf der Stangenbahn bleiben)
      function squat(d) {
        const o = base(work, {
          pelvis: work.center.clone().addScaledVector(st.dir, L(.0, .18, d)).setY(L(SY - .006, s.depth, d)),
          pitch: L(4, 31, d), flex: L(0, -9, d), head: L(2, 14, d), shrug: .25
        });
        const mid = ctx.fitToBar(o, s.grip, .15, .16);
        o.hand = ctx.around(mid, .045); o.elbow = ctx.elbowsDownOut(.45, .15); o.bar = true;
        return o;
      }
      const top = squat(0);
      const hTop = top.hand.L.y;

      const walk = ctx.walk({ from: this.start, to: pick.center, yaw: st.yaw, halfW: s.halfW, toe: s.toe });
      const intro = [
        { id: 'ready', label: 'Startposition', dur: .8, pose: () => walk.pose(0) },
        { id: 'walk', label: 'Zum Rack laufen', dur: walk.dur * 1.05, pose: u => walk.pose(u) },
        { id: 'grip', label: 'Vor die T-Bar stellen und das Stangenende greifen', dur: 1.7, pose(u) {
          const k = E(u), o = base(pick, {
            pelvis: pick.center.clone().addScaledVector(st.dir, L(0, .2, k)).setY(L(SY - .03, .52, k)),
            pitch: L(2, 48, k), flex: L(0, 4, k), head: L(0, -22, k)
          });
          const hz = ctx.hang(o), r = ctx.smooth(ctx.clamp((u - .25) / .75, 0, 1)), g = ctx.around(grip, .045);
          o.hand = { L: hz.L.lerp(g.L, r), R: hz.R.lerp(g.R, r) }; o.elbow = ctx.elbowsDownOut(.35, -.2);
          return o;
        } },
        { id: 'lift', label: 'T-Bar mit geradem Rücken anheben', dur: 1.6, pose(u) {
          const k = E(u), h = L(grip.y, s.hold, k), mid = ctx.barPoint(h, s.grip);
          const o = base(pick, {
            pelvis: pick.center.clone().addScaledVector(st.dir, L(.2, .03, k)).setY(L(.52, SY - .03, k)),
            pitch: L(48, 9, k), flex: L(4, 0, k), head: L(-22, -2, k), bar: true
          });
          o.hand = ctx.around(mid, .045); o.elbow = ctx.elbowsDownOut(.35, -.2);
          return o;
        } },
        { id: 'step', label: 'Einen kleinen Schritt näher an die T-Bar', dur: 1.3, pose(u) {
          // zwei kurze Schritte (links, rechts) – die Hände halten die Stange an derselben Stelle
          const a = ctx.smooth(ctx.clamp(u / .5, 0, 1)), b = ctx.smooth(ctx.clamp((u - .5) / .5, 0, 1));
          const lift = x => Math.sin(Math.PI * x) * .05;
          const ank = {
            L: pick.ankle.L.clone().lerp(work.ankle.L, a).setY(ctx.S3.DIM.ank + lift(a)),
            R: pick.ankle.R.clone().lerp(work.ankle.R, b).setY(ctx.S3.DIM.ank + lift(b))
          };
          const c = pick.center.clone().lerp(work.center, (a + b) / 2);
          const mid = ctx.barPoint(s.hold, s.grip);
          const o = base(work, { ankle: ank, pelvis: c.addScaledVector(st.dir, L(.03, .0, (a + b) / 2)).setY(SY - .03), pitch: L(9, 4, (a + b) / 2), head: -2, bar: true });
          o.hand = ctx.around(mid, .045); o.elbow = ctx.elbowsDownOut(.35, -.1);
          return o;
        } },
        { id: 'rack', label: 'Ausgangsposition: T-Bar vor der Brust, Bauch fest', dur: 1.3, pose(u) {
          const k = E(u), h = L(s.hold, hTop, k), mid = ctx.barPoint(h, s.grip);
          const o = ctx.lerpPose(base(work, { pelvis: work.center.clone().setY(SY - .03), pitch: 4, head: -2, shrug: 0 }), top, k);
          o.hand = ctx.around(mid, .045); o.elbow = ctx.elbowsDownOut(L(.35, .45, k), L(-.1, .15, k)); o.bar = true;
          return o;
        } },
        { id: 'set', label: 'Füße schulterbreit, Zehen leicht nach außen, Oberkörper aufrecht', dur: 1.0, pose: () => top },
      ];
      const rep = [
        { id: 'down', label: 'Kontrolliert nach unten: Hüfte und Knie beugen', dur: 2.0, pose: u => squat(E(u)) },
        { id: 'bottom', label: 'Tiefster Punkt: Fersen am Boden, Knie Richtung Fußspitzen', dur: .45, pose: () => squat(1) },
        { id: 'up', label: 'Kraftvoll und sauber nach oben', dur: 1.05, pose: u => squat(1 - E(u)) },
        { id: 'top', label: 'Oben ganz aufrichten – Bauch fest', dur: .8, pose: () => top },
      ];
      const outro = [{ id: 'end', label: 'Aufrechte Ausgangsposition', dur: 1.2, pose: () => top }];
      void standPick;
      return { intro, rep, outro, reps: this.reps };
    }
  });
})();
