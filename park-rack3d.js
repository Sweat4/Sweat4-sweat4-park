/* =====================================================================
   SW4 PARK – Rack-Zeichnung (3D) als Baustein für die Übungsvorführung
   Unveränderte Geometrie der zuletzt erstellten Rack-Visualisierung
   (2 Racks, Barren 60 cm, T-Bar-Halterungen, Dip-Station, Bandbalken; Gesamthöhe 2,30 m).
   Benötigt three.min.js (r149, MIT). Enthält RoundedBoxGeometry und RoomEnvironment
   aus den three.js-Beispielen (MIT-Lizenz, Copyright three.js authors).

   SW4Rack.build(scene, renderer, { quality }) → { stations, beam, dims }
     stations.tbarL / tbarR: Drehpunkt, Richtung und bewegliche Stange der T-Bar
   ===================================================================== */
(function () {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) throw new Error('three.js fehlt');

/* ---------- RoundedBoxGeometry (three.js examples, MIT) ---------- */
const RoundedBoxGeometry = (function () {
const { BoxGeometry, Vector3 } = THREE;

const _tempNormal = new Vector3();

function getUv( faceDirVector, normal, uvAxis, projectionAxis, radius, sideLength ) {

	const totArcLength = 2 * Math.PI * radius / 4;

	// length of the planes between the arcs on each axis
	const centerLength = Math.max( sideLength - 2 * radius, 0 );
	const halfArc = Math.PI / 4;

	// Get the vector projected onto the Y plane
	_tempNormal.copy( normal );
	_tempNormal[ projectionAxis ] = 0;
	_tempNormal.normalize();

	// total amount of UV space alloted to a single arc
	const arcUvRatio = 0.5 * totArcLength / ( totArcLength + centerLength );

	// the distance along one arc the point is at
	const arcAngleRatio = 1.0 - ( _tempNormal.angleTo( faceDirVector ) / halfArc );

	if ( Math.sign( _tempNormal[ uvAxis ] ) === 1 ) {

		return arcAngleRatio * arcUvRatio;

	} else {

		// total amount of UV space alloted to the plane between the arcs
		const lenUv = centerLength / ( totArcLength + centerLength );
		return lenUv + arcUvRatio + arcUvRatio * ( 1.0 - arcAngleRatio );

	}

}

class RoundedBoxGeometry extends BoxGeometry {

	constructor( width = 1, height = 1, depth = 1, segments = 2, radius = 0.1 ) {

		// ensure segments is odd so we have a plane connecting the rounded corners
		segments = segments * 2 + 1;

		// ensure radius isn't bigger than shortest side
		radius = Math.min( width / 2, height / 2, depth / 2, radius );

		super( 1, 1, 1, segments, segments, segments );

		// if we just have one segment we're the same as a regular box
		if ( segments === 1 ) return;

		const geometry2 = this.toNonIndexed();

		this.index = null;
		this.attributes.position = geometry2.attributes.position;
		this.attributes.normal = geometry2.attributes.normal;
		this.attributes.uv = geometry2.attributes.uv;

		//

		const position = new Vector3();
		const normal = new Vector3();

		const box = new Vector3( width, height, depth ).divideScalar( 2 ).subScalar( radius );

		const positions = this.attributes.position.array;
		const normals = this.attributes.normal.array;
		const uvs = this.attributes.uv.array;

		const faceTris = positions.length / 6;
		const faceDirVector = new Vector3();
		const halfSegmentSize = 0.5 / segments;

		for ( let i = 0, j = 0; i < positions.length; i += 3, j += 2 ) {

			position.fromArray( positions, i );
			normal.copy( position );
			normal.x -= Math.sign( normal.x ) * halfSegmentSize;
			normal.y -= Math.sign( normal.y ) * halfSegmentSize;
			normal.z -= Math.sign( normal.z ) * halfSegmentSize;
			normal.normalize();

			positions[ i + 0 ] = box.x * Math.sign( position.x ) + normal.x * radius;
			positions[ i + 1 ] = box.y * Math.sign( position.y ) + normal.y * radius;
			positions[ i + 2 ] = box.z * Math.sign( position.z ) + normal.z * radius;

			normals[ i + 0 ] = normal.x;
			normals[ i + 1 ] = normal.y;
			normals[ i + 2 ] = normal.z;

			const side = Math.floor( i / faceTris );

			switch ( side ) {

				case 0: // right

					// generate UVs along Z then Y
					faceDirVector.set( 1, 0, 0 );
					uvs[ j + 0 ] = getUv( faceDirVector, normal, 'z', 'y', radius, depth );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'z', radius, height );
					break;

				case 1: // left

					// generate UVs along Z then Y
					faceDirVector.set( - 1, 0, 0 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'z', 'y', radius, depth );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'z', radius, height );
					break;

				case 2: // top

					// generate UVs along X then Z
					faceDirVector.set( 0, 1, 0 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'z', radius, width );
					uvs[ j + 1 ] = getUv( faceDirVector, normal, 'z', 'x', radius, depth );
					break;

				case 3: // bottom

					// generate UVs along X then Z
					faceDirVector.set( 0, - 1, 0 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'z', radius, width );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'z', 'x', radius, depth );
					break;

				case 4: // front

					// generate UVs along X then Y
					faceDirVector.set( 0, 0, 1 );
					uvs[ j + 0 ] = 1.0 - getUv( faceDirVector, normal, 'x', 'y', radius, width );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'x', radius, height );
					break;

				case 5: // back

					// generate UVs along X then Y
					faceDirVector.set( 0, 0, - 1 );
					uvs[ j + 0 ] = getUv( faceDirVector, normal, 'x', 'y', radius, width );
					uvs[ j + 1 ] = 1.0 - getUv( faceDirVector, normal, 'y', 'x', radius, height );
					break;

			}

		}

	}

}


return RoundedBoxGeometry; })();

/* ---------- RoomEnvironment (three.js examples, MIT) ---------- */
const RoomEnvironment = (function () {
/**
 * https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/EnvironmentScene.ts
 */

const { BackSide, BoxGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight, Scene } = THREE;

class RoomEnvironment extends Scene {

	constructor() {

		super();

		const geometry = new BoxGeometry();
		geometry.deleteAttribute( 'uv' );

		const roomMaterial = new MeshStandardMaterial( { side: BackSide } );
		const boxMaterial = new MeshStandardMaterial();

		const mainLight = new PointLight( 0xffffff, 5.0, 28, 2 );
		mainLight.position.set( 0.418, 16.199, 0.300 );
		this.add( mainLight );

		const room = new Mesh( geometry, roomMaterial );
		room.position.set( - 0.757, 13.219, 0.717 );
		room.scale.set( 31.713, 28.305, 28.591 );
		this.add( room );

		const box1 = new Mesh( geometry, boxMaterial );
		box1.position.set( - 10.906, 2.009, 1.846 );
		box1.rotation.set( 0, - 0.195, 0 );
		box1.scale.set( 2.328, 7.905, 4.651 );
		this.add( box1 );

		const box2 = new Mesh( geometry, boxMaterial );
		box2.position.set( - 5.607, - 0.754, - 0.758 );
		box2.rotation.set( 0, 0.994, 0 );
		box2.scale.set( 1.970, 1.534, 3.955 );
		this.add( box2 );

		const box3 = new Mesh( geometry, boxMaterial );
		box3.position.set( 6.167, 0.857, 7.803 );
		box3.rotation.set( 0, 0.561, 0 );
		box3.scale.set( 3.927, 6.285, 3.687 );
		this.add( box3 );

		const box4 = new Mesh( geometry, boxMaterial );
		box4.position.set( - 2.017, 0.018, 6.124 );
		box4.rotation.set( 0, 0.333, 0 );
		box4.scale.set( 2.002, 4.566, 2.064 );
		this.add( box4 );

		const box5 = new Mesh( geometry, boxMaterial );
		box5.position.set( 2.291, - 0.756, - 2.621 );
		box5.rotation.set( 0, - 0.286, 0 );
		box5.scale.set( 1.546, 1.552, 1.496 );
		this.add( box5 );

		const box6 = new Mesh( geometry, boxMaterial );
		box6.position.set( - 2.193, - 0.369, - 5.547 );
		box6.rotation.set( 0, 0.516, 0 );
		box6.scale.set( 3.875, 3.487, 2.986 );
		this.add( box6 );


		// -x right
		const light1 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light1.position.set( - 16.116, 14.37, 8.208 );
		light1.scale.set( 0.1, 2.428, 2.739 );
		this.add( light1 );

		// -x left
		const light2 = new Mesh( geometry, createAreaLightMaterial( 50 ) );
		light2.position.set( - 16.109, 18.021, - 8.207 );
		light2.scale.set( 0.1, 2.425, 2.751 );
		this.add( light2 );

		// +x
		const light3 = new Mesh( geometry, createAreaLightMaterial( 17 ) );
		light3.position.set( 14.904, 12.198, - 1.832 );
		light3.scale.set( 0.15, 4.265, 6.331 );
		this.add( light3 );

		// +z
		const light4 = new Mesh( geometry, createAreaLightMaterial( 43 ) );
		light4.position.set( - 0.462, 8.89, 14.520 );
		light4.scale.set( 4.38, 5.441, 0.088 );
		this.add( light4 );

		// -z
		const light5 = new Mesh( geometry, createAreaLightMaterial( 20 ) );
		light5.position.set( 3.235, 11.486, - 12.541 );
		light5.scale.set( 2.5, 2.0, 0.1 );
		this.add( light5 );

		// +y
		const light6 = new Mesh( geometry, createAreaLightMaterial( 100 ) );
		light6.position.set( 0.0, 20.0, 0.0 );
		light6.scale.set( 1.0, 0.1, 1.0 );
		this.add( light6 );

	}

	dispose() {

		const resources = new Set();

		this.traverse( ( object ) => {

			if ( object.isMesh ) {

				resources.add( object.geometry );
				resources.add( object.material );

			}

		} );

		for ( const resource of resources ) {

			resource.dispose();

		}

	}

}

function createAreaLightMaterial( intensity ) {

	const material = new MeshBasicMaterial();
	material.color.setScalar( intensity );
	return material;

}


return RoomEnvironment; })();

function build(scene, renderer, opt = {}) {
  const P = new URLSearchParams('');                  // feste Maße – keine URL-Parameter in der App
  const legacy = THREE.ColorManagement.legacyMode;  // Farben wie in der Rack-Visualisierung (Standard r149)
  THREE.ColorManagement.legacyMode = true;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const LANDMINES = [];
/* ---------- Materialien ---------- */
// feine Pulverstruktur als Bump-Map (Rauschen)
function noiseTex(n = 512, amp = 26) {
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), d = g.createImageData(n, n);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - .5) * amp; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
const bump = noiseTex();
const powder = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: 0.58, metalness: 0.1, clearcoat: 0.25, clearcoatRoughness: 0.5, bumpMap: bump, bumpScale: 0.002, envMapIntensity: 0.55 });
const steel = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd0, roughness: 0.22, metalness: 1.0 });
const bolt = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.35, metalness: 0.9 });
const tex = new THREE.TextureLoader().load(opt.logo || 'sw4-logo-gold.png'); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
const gold = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.35, color: 0xffffff, metalness: 0.75, roughness: 0.32, clearcoat: 0.3, polygonOffset: true, polygonOffsetFactor: -2 });

/* ---------- Maße (nach Foto geschätzt, m) ---------- */
const HGT = 2.10, T = 0.08, Xs = 0.75, Zs = [0.65, 0, -0.7];   // Pfosten 80×80, Breite 1,5 m, drei Pfostenpaare
const GAP = +P.get('gap') || 2.0, BAR_Y = 1.3;          // Abstand zwischen den Racks, Höhe der Barren-Holme
const SPAN = 2 * Xs + GAP, OFF = SPAN / 2;            // Rack-Mitten bei ±OFF
let rack = null;
const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = m.receiveShadow = true; rack.add(m); return m; };
const tube = (len) => new RoundedBoxGeometry(T, len, T, 3, 0.008);
function buildRack(ox, ladder, ry = 0) {
  rack = new THREE.Group(); rack.position.x = ox; rack.rotation.y = ry; scene.add(rack);
// Pfosten + Fußplatten mit Dübeln
for (const z of Zs) for (const s of [-1, 1]) {
  add(tube(HGT), powder, s * Xs, HGT / 2 + 0.008, z);
  add(new RoundedBoxGeometry(0.24, 0.012, 0.24, 2, 0.004), powder, s * Xs, 0.006, z);
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) add(new THREE.CylinderGeometry(0.011, 0.011, 0.014, 12), bolt, s * Xs + dx * 0.085, 0.013, z + dz * 0.085);
}
// obere Längsholme + Quertraversen
for (const s of [-1, 1]) add(new RoundedBoxGeometry(T, T, Zs[0] - Zs[2] + T, 3, 0.008), powder, s * Xs, HGT - T / 2 + 0.008, (Zs[0] + Zs[2]) / 2);
add(new RoundedBoxGeometry(2 * Xs + T, T, T, 3, 0.008), powder, 0, HGT - T / 2 + 0.008, Zs[2]);
// Sprossen (Leiter) zwischen den hinteren Pfosten
const rungs = [0.30, 0.63, 0.96, 1.29, 1.62, 1.95];
if (ladder) for (const y of rungs) add(new THREE.CylinderGeometry(0.016, 0.016, 2 * Xs, 20), powder, 0, y, Zs[2], 0, 0, Math.PI / 2);
// Klimmzug-Bügel (Edelstahl): zwei gekröpfte Rohre über dem vorderen Feld + Streben
function bentBar(z0) {
  const r = 0.0165, rise = 0.17, inset = 0.24, y0 = HGT + 0.01;
  const pts = [new THREE.Vector3(-Xs, y0, z0), new THREE.Vector3(-Xs + inset, y0 + rise, z0), new THREE.Vector3(Xs - inset, y0 + rise, z0), new THREE.Vector3(Xs, y0, z0)];
  const path = new THREE.CurvePath(); for (let i = 0; i < 3; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  const g = new THREE.TubeGeometry(path, 120, r, 18, false); return add(g, steel, 0, 0, 0);
}
bentBar(Zs[0] - 0.02); bentBar(Zs[1] + 0.02);
for (const s of [-1, 1]) {
  const a = new THREE.Vector3(s * (Xs - 0.24), HGT + 0.18, Zs[0] - 0.02), b = new THREE.Vector3(s * 0.12, HGT + 0.18, Zs[1] + 0.02);
  const g = new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 8, 0.013, 14, false); add(g, steel, 0, 0, 0);
}
add(new THREE.CylinderGeometry(0.0165, 0.0165, Zs[0] - Zs[1], 18), steel, 0, HGT + 0.18, (Zs[0] + Zs[1]) / 2, Math.PI / 2, 0, 0);
// Logo: goldenes SW4 senkrecht auf beiden vorderen Pfosten (Vorderseite)
const aspect = 2048 / 745, lh = 0.07, lw = lh * aspect;
for (const s of [-1, 1]) add(new THREE.PlaneGeometry(lw, lh), gold, s * Xs, 1.62, Zs[0] + T / 2 + 0.0008, 0, 0, Math.PI / 2).castShadow = false;
// Logo zusätzlich quer auf der hinteren oberen Traverse
add(new THREE.PlaneGeometry(0.075 * aspect * 1.1, 0.068), gold, 0, HGT - T / 2 + 0.008, Zs[2] + T / 2 + 0.0008).castShadow = false;

}
// Rack 1 (Sprossenwand) um 90° nach rechts gedreht, Rack 2 um 90° nach links: die Rückseiten zeigen zur Mitte
const FACE = -Zs[2] + T / 2;                          // Abstand Rack-Mitte → Rückseite
buildRack(-(GAP / 2 + FACE), true, -Math.PI / 2);
buildRack(GAP / 2 + FACE, false, Math.PI / 2);
// Barren: zwei Holme (Abstand BW) auf vier eigenen Füßen + je ein Querverbinder zu den äußeren Pfosten der Racks
const BW = +P.get('bw') || 0.6, LT = 0.06, EX = GAP / 2 - 0.09;
rack = new THREE.Group(); scene.add(rack);
for (const z of [-BW / 2, BW / 2]) add(new THREE.CylinderGeometry(0.022, 0.022, 2 * EX + 0.12, 24), powder, 0, BAR_Y, z, 0, 0, Math.PI / 2);
for (const sx of [-1, 1]) {
  for (const z of [-BW / 2, BW / 2]) {      // Füße
    add(new RoundedBoxGeometry(LT, BAR_Y - 0.03, LT, 3, 0.006), powder, sx * EX, (BAR_Y - 0.03) / 2 + 0.008, z);
    add(new RoundedBoxGeometry(0.18, 0.012, 0.18, 2, 0.004), powder, sx * EX, 0.006, z);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) add(new THREE.CylinderGeometry(0.01, 0.01, 0.014, 12), bolt, sx * EX + dx * 0.062, 0.013, z + dz * 0.062);
  }
  // Querverbinder: von den äußeren Pfosten des Racks (z = ±Xs) über die Füße, knapp unter den Holmen
  add(new RoundedBoxGeometry(LT, LT, 2 * Xs - T + 0.004, 3, 0.006), powder, sx * EX, BAR_Y - 0.06, 0);
  add(new RoundedBoxGeometry(GAP / 2 - EX + 0.01, LT, LT, 3, 0.006), powder, sx * (EX + (GAP / 2 - EX) / 2), BAR_Y - 0.06, Xs);
  add(new RoundedBoxGeometry(GAP / 2 - EX + 0.01, LT, LT, 3, 0.006), powder, sx * (EX + (GAP / 2 - EX) / 2), BAR_Y - 0.06, -Xs);
}
/* ---------- T-Bar-Halterungen (Landmine) vorne am mittleren Pfosten + Olympia-Stange mit 20-kg-Scheibe ---------- */
const chrome = new THREE.MeshPhysicalMaterial({ color: 0xd4d7db, roughness: 0.18, metalness: 1.0 });
const knurl = new THREE.MeshPhysicalMaterial({ color: 0xb9bcc0, roughness: 0.42, metalness: 1.0, bumpMap: noiseTex(256, 90), bumpScale: 0.004 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x101011, roughness: 0.88, metalness: 0.0 });
const plateTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#131314'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#c9a463'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('20 KG', 256, 92); g.save(); g.translate(256, 420); g.fillText('SW4', 0, 0); g.restore();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
const plateFace = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.85, metalness: 0.0 });
function landmine(px, pz, yaw) {
  rack = new THREE.Group(); rack.position.set(px, 0, pz); rack.rotation.y = yaw; scene.add(rack);
  // Klemmhalterung am Pfosten (umschließt das 80er-Rohr), Gelenk, Hülse
  const PY = 0.2;
  add(new RoundedBoxGeometry(T + 0.03, 0.2, T + 0.03, 3, 0.008), powder, 0, PY, -(T / 2 + 0.015) + T / 2 + 0.015 - 0.0);
  add(new RoundedBoxGeometry(0.1, 0.05, 0.09, 2, 0.008), powder, 0, PY, T / 2 + 0.06);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 20), chrome, 0, PY, T / 2 + 0.1, 0, 0, Math.PI / 2);
  // Stange: Richtung +z, Ende mit Scheibe liegt am Boden (Scheibe Ø 45 cm)
  const R = 0.225, L = 2.2, start = new THREE.Vector3(0, PY, T / 2 + 0.1);
  const dz = Math.sqrt(L * L - (R - PY) ** 2), dir = new THREE.Vector3(0, R - PY, dz).normalize();
  const g = new THREE.Group(); g.position.copy(start); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); rack.add(g);
  const seg = (r, a, b, mat, sides = 28) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, b - a, sides), mat); m.position.y = (a + b) / 2; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  seg(0.034, -0.02, 0.32, powder);                 // Hülse der Halterung
  seg(0.025, 0.0, 0.415, chrome);                  // Hantelhülse (steckt in der Halterung)
  seg(0.0375, 0.415, 0.445, chrome);               // Bund
  seg(0.014, 0.445, L - 0.445, knurl);             // Griffstange
  seg(0.0375, L - 0.445, L - 0.415, chrome);       // Bund
  seg(0.025, L - 0.415, L, chrome);                // Hantelhülse mit Scheibe
  // 20-kg-Scheibe (Bumper) nahe am Bund, Schnellverschluss davor
  const pY = L - 0.415 + 0.05;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.07, 64), [rubber, plateFace, plateFace]); disc.position.y = pY; disc.castShadow = disc.receiveShadow = true; g.add(disc);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.074, 32), chrome); hub.position.y = pY; g.add(hub);
  seg(0.032, pY + 0.04, pY + 0.075, powder);       // Verschluss
  LANDMINES.push({ group: rack, bar: g, start: start.clone(), L, PY, R, plateAt: pY, restDir: dir.clone() });
}
const MID = GAP / 2 + FACE, FZ = Xs;                 // mittlere Pfosten, Vorderseite
landmine(-MID, FZ, -0.18);
landmine(MID, FZ, 0.18);

/* ---------- Dip-Station: hinten am mittleren Pfosten des linken Racks (gegenüber der linken T-Bar), Höhe wie Barren ---------- */
(function () {
  rack = new THREE.Group(); rack.position.set(-MID, 0, -Xs); scene.add(rack);
  const DW = 0.56, DL = 0.6, Y = BAR_Y;                 // Griffabstand, Länge der Holme
  add(new RoundedBoxGeometry(T + 0.03, 0.22, T + 0.03, 3, 0.008), powder, 0, Y - 0.04, 0);          // Klemme um den Pfosten
  add(new RoundedBoxGeometry(DW + 0.06, 0.06, 0.06, 3, 0.006), powder, 0, Y - 0.04, -(T / 2 + 0.045)); // Querträger
  for (const sx of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.022, 0.022, DL, 24), powder, sx * DW / 2, Y, -(T / 2 + 0.045) - DL / 2, Math.PI / 2, 0, 0);   // Holm
    add(new RoundedBoxGeometry(0.06, 0.08, 0.06, 2, 0.006), powder, sx * DW / 2, Y - 0.02, -(T / 2 + 0.045));                     // Knoten
    add(new THREE.SphereGeometry(0.024, 20, 14), powder, sx * DW / 2, Y, -(T / 2 + 0.045) - DL);                                 // Endkappe
  }
})();

/* ---------- Verstellbarer Querbalken mit 5 Power-Bändern: hinten am rechten Rack (Seite der Dip-Station) ---------- */
const BEAM = (function () {
  const cx = MID, z0 = -Xs - T / 2;                    // Rückseite des rechten Racks
  const xs = [cx - 0.7, cx + 0.65];                    // äußere Pfosten
  // Lochreihe für den Steckbolzen an beiden äußeren Pfosten
  rack = new THREE.Group(); scene.add(rack);
  for (const x of xs) for (let y = 0.6; y <= 1.9; y += 0.1) add(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 14), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 }), x, y, z0 - 0.001, Math.PI / 2, 0, 0).castShadow = false;
  const g = new THREE.Group(); scene.add(g); rack = g;
  const BZ = z0 - 0.07, L = xs[1] - xs[0] + 0.16, mx = (xs[0] + xs[1]) / 2;
  add(new RoundedBoxGeometry(L, 0.07, 0.07, 3, 0.008), powder, mx, 0, BZ);                         // Balken
  for (const x of xs) {
    add(new RoundedBoxGeometry(T + 0.024, 0.16, T + 0.024, 3, 0.008), powder, x, 0, z0 + T / 2);  // Schiebehülse um den Pfosten
    add(new RoundedBoxGeometry(0.05, 0.05, 0.05, 2, 0.006), powder, x, 0, z0 - 0.03);             // Verbinder
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 14), chrome, x + (x < mx ? -1 : 1) * (T / 2 + 0.04), 0.04, z0 + T / 2, 0, 0, Math.PI / 2);   // Steckbolzen
    add(new THREE.SphereGeometry(0.02, 16, 12), powder, x + (x < mx ? -1 : 1) * (T / 2 + 0.075), 0.04, z0 + T / 2);
  }
  // 5 Ösen mit Karabiner + Power-Band (Schlaufe hängt nach unten)
  const cols = [0xb3261e, 0x1d1d1f, 0x6a3d9a, 0x2e7d32, 0x1f5fa8];
  for (let i = 0; i < 5; i++) {
    const x = mx + (i - 2) * (L - 0.24) / 4;
    add(new THREE.TorusGeometry(0.022, 0.006, 10, 24), chrome, x, -0.055, BZ, 0, Math.PI / 2, 0);
    const bandMat = new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.7, metalness: 0 });
    const len = 0.95, w = 0.035, pts = [];
    for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; pts.push(new THREE.Vector3(Math.sin(a) * w, -0.075 - (1 - Math.cos(a)) / 2 * len, 0)); }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 120, 0.009, 8, true);
    const m = add(geo, bandMat, x, 0, BZ); m.scale.set(1, 1, 0.35);
  }
  return g;
})();

/* ---------- Boden ---------- */
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 96), new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.2 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

/* ---------- Licht (Studio) ---------- */
scene.add(new THREE.HemisphereLight(0x8a8f99, 0x050505, 0.15));
const key = new THREE.DirectionalLight(0xfff3e2, 1.8); key.position.set(3.2, 6, 4.2); key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 4; key.shadow.camera.bottom = -2; key.shadow.radius = 4; key.shadow.bias = -0.0004; scene.add(key);
const rim = new THREE.SpotLight(0xd9b26a, 30, 14, 0.6, 0.6); rim.position.set(-4, 3.5, -4); rim.target.position.set(0, 1.2, 0); scene.add(rim, rim.target);
const rim2 = new THREE.SpotLight(0xffffff, 12, 14, 0.5, 0.8); rim2.position.set(5.5, 3.2, -3.5); rim2.target.position.set(0, 1.3, 0); scene.add(rim2, rim2.target);
const fill = new THREE.PointLight(0xffffff, 3, 9); fill.position.set(-1.5, 2.6, 4.5); scene.add(fill);
// Bodenlicht-Kegel (Spotlight von oben) für Studio-Stimmung
const top = new THREE.SpotLight(0xffffff, 34, 12, 0.75, 0.95); top.position.set(0, 6.5, 0.3); top.target.position.set(0, 0, 0); scene.add(top, top.target);
  if (opt.quality === 'low') { key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 2; }
  else if (opt.quality !== 'high') key.shadow.mapSize.set(2048, 2048);
  BEAM.position.y = opt.beamY || 1.25;   // Bandbalken auf 1,25 m (wie in der Rack-Visualisierung)
  THREE.ColorManagement.legacyMode = legacy;
  const station = (lm) => {   // Weltkoordinaten der T-Bar
    lm.group.updateMatrixWorld(true);
    const pivot = lm.start.clone().applyMatrix4(lm.group.matrixWorld);
    const dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), lm.group.rotation.y);
    return Object.assign(lm, { pivot, dir });
  };
  return {
    stations: { tbarL: station(LANDMINES[0]), tbarR: station(LANDMINES[1]) },
    beam: BEAM,
    dims: { HGT, T, Xs, Zs, GAP, BAR_Y, BW, MID, FACE }
  };
}
window.SW4Rack = { build, version: 1 };
})();
