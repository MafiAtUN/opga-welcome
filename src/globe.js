// ═══════════════════════════════════════════════════════════════════════════
//  The globe.
//
//  Land is drawn from the same particle field that made the logo — the Earth
//  is literally the mark rearranged. On top of that sit the country markers,
//  the light pillars, the great-circle arcs to UN Headquarters, and a fresnel
//  atmosphere.
//
//  Country membership is resolved with d3.geoContains against the ~30 nations
//  we actually care about (bounding-box rejected first), which is exact and
//  far cheaper than testing every country in the atlas.
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from '../vendor/three.module.js';
import { COUNTRIES, UN_HQ } from '../data/countries.js';

export const R = 95;                  // globe radius in world units
const DEG = Math.PI / 180;

export function latLngToVec3(lat, lng, r = R) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Globe rotation that brings (lat, lng) to face the camera. See notes in README. */
export function facingRotation(lat, lng) {
  return { x: lat * DEG, y: -(Math.PI / 2 + lng * DEG) };
}

/** Pick the angle congruent to `target` that is nearest `current`, so tweens take the short way. */
export function shortestAngle(current, target) {
  let d = (target - current) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return current + d;
}

// ── Land sampling ───────────────────────────────────────────────────────────

/**
 * Distribute `count` points over the land surface using a Fibonacci sphere
 * (even spacing, no polar clustering) filtered against the land mask.
 *
 * Returns { positions, colors, countryOf } where countryOf[i] is the country
 * name for particle i, or null.
 */
export function buildLandPoints(count, landFeature, wanted) {
  const cands = Math.ceil(count / 0.28) + 4000;   // land is ~28% of the surface
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const contains = window.d3.geoContains;

  const lats = [], lngs = [];
  for (let i = 0; i < cands; i++) {
    const y = 1 - (i / (cands - 1)) * 2;
    const lat = Math.asin(y) / DEG;
    const lng = ((i * GOLDEN) / DEG) % 360 - 180;
    if (contains(landFeature, [lng, lat])) { lats.push(lat); lngs.push(lng); }
  }

  // Reserve a slice of the field for island states the 110m atlas omits.
  const islands = wanted.filter((c) => COUNTRIES[c] && COUNTRIES[c].atlas === null);
  const ISLAND_DOTS = 55;
  const reserved = islands.length * ISLAND_DOTS;
  const landWanted = Math.max(count - reserved, 0);

  // Even subsample of the land candidates, so coverage stays uniform.
  const stride = lats.length / landWanted;
  const chosenLat = new Float64Array(landWanted);
  const chosenLng = new Float64Array(landWanted);
  for (let i = 0; i < landWanted; i++) {
    const j = Math.min(Math.floor(i * stride), lats.length - 1);
    chosenLat[i] = lats[j];
    chosenLng[i] = lngs[j];
  }

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const countryOf = new Array(count).fill(null);
  const c = new THREE.Color();
  const base = new THREE.Color('#0E6E9E');
  const highland = new THREE.Color('#12A0D8');

  const write = (i, lat, lng, country) => {
    const v = latLngToVec3(lat, lng, R + (Math.random() - 0.5) * 1.1);
    positions[i * 3] = v.x; positions[i * 3 + 1] = v.y; positions[i * 3 + 2] = v.z;
    // Subtle latitude shading so the sphere reads as a body, not a flat disc.
    c.copy(base).lerp(highland, 0.35 + Math.random() * 0.45);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    countryOf[i] = country;
  };

  for (let i = 0; i < landWanted; i++) write(i, chosenLat[i], chosenLng[i], null);

  // Island states: a tight disc of dots at the centroid so they are visibly
  // present on the globe. Barbados and Saint Kitts and Nevis are real
  // colleagues; they are not going to be invisible because of map resolution.
  let k = landWanted;
  for (const name of islands) {
    const { lat, lng } = COUNTRIES[name];
    for (let n = 0; n < ISLAND_DOTS && k < count; n++, k++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * 1.5;
      write(k, lat + Math.sin(a) * rr, lng + Math.cos(a) * rr * 1.4, name);
    }
  }
  while (k < count) { write(k, chosenLat[k % landWanted], chosenLng[k % landWanted], null); k++; }

  return { positions, colors, countryOf, landWanted };
}

/**
 * Tag each land particle with the country it falls inside. Only tests the
 * countries we actually have staff from, and rejects by bounding box first.
 */
export function assignCountries(countryOf, positions, landWanted, countriesTopo, wanted) {
  const topojson = window.topojson;
  const d3 = window.d3;
  const fc = topojson.feature(countriesTopo, countriesTopo.objects.countries);

  // atlas name -> our country name
  const atlasToOurs = new Map();
  for (const name of wanted) {
    const atlas = COUNTRIES[name]?.atlas;
    if (atlas) atlasToOurs.set(atlas, name);
  }

  // Precompute lat/lng for each land particle once.
  const ll = new Float64Array(landWanted * 2);
  for (let i = 0; i < landWanted; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const r = Math.hypot(x, y, z);
    ll[i * 2] = Math.asin(y / r) / DEG;                       // lat
    ll[i * 2 + 1] = (Math.atan2(z, -x) / DEG) - 180;          // lng
    if (ll[i * 2 + 1] < -180) ll[i * 2 + 1] += 360;
  }

  const missing = [];
  for (const feat of fc.features) {
    const ours = atlasToOurs.get(feat.properties.name);
    if (!ours) continue;
    const [[w, s], [e, n]] = d3.geoBounds(feat);
    const wraps = w > e;
    for (let i = 0; i < landWanted; i++) {
      if (countryOf[i]) continue;
      const lat = ll[i * 2], lng = ll[i * 2 + 1];
      if (lat < s - 0.5 || lat > n + 0.5) continue;
      if (!wraps && (lng < w - 0.5 || lng > e + 0.5)) continue;
      if (d3.geoContains(feat, [lng, lat])) countryOf[i] = ours;
    }
    atlasToOurs.delete(feat.properties.name);
  }
  for (const [atlas, ours] of atlasToOurs) missing.push(`${ours} (atlas name "${atlas}")`);

  // Group indices by country for the ignition step.
  const indicesByCountry = new Map();
  for (let i = 0; i < countryOf.length; i++) {
    const c = countryOf[i];
    if (!c) continue;
    if (!indicesByCountry.has(c)) indicesByCountry.set(c, []);
    indicesByCountry.get(c).push(i);
  }
  return { indicesByCountry, missing };
}

// ── Decoration: atmosphere, markers, pillars, arcs ──────────────────────────

export function makeAtmosphere() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#2BB6ED') },
      uPower: { value: 3.1 },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vP;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vP = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uPower; uniform float uOpacity;
      varying vec3 vN; varying vec3 vP;
      void main() {
        float f = pow(1.0 - abs(dot(vN, vP)), uPower);
        gl_FragColor = vec4(uColor, f * uOpacity);
      }`,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.16, 48, 48), mat);
  mesh.material.uniforms = mat.uniforms;
  return mesh;
}

/** A soft round sprite texture, drawn once and shared by every marker. */
function markerTexture() {
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d').createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.00, 'rgba(255,248,230,1)');
  g.addColorStop(0.18, 'rgba(242,178,51,0.95)');
  g.addColorStop(0.45, 'rgba(242,178,51,0.30)');
  g.addColorStop(1.00, 'rgba(242,178,51,0)');
  const ctx = cv.getContext('2d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * One marker + light pillar per country, all invisible until ignition.
 * Returns a Map of country -> { marker, pillar } for the timeline to animate.
 */
export function makeMarkers(countries) {
  const group = new THREE.Group();
  const tex = markerTexture();
  const out = new Map();

  const pillarGeo = new THREE.CylinderGeometry(0.9, 0.9, 1, 7, 1, true);
  pillarGeo.translate(0, 0.5, 0);   // grow upward from the base

  for (const name of countries) {
    const meta = COUNTRIES[name];
    if (!meta) continue;
    const pos = latLngToVec3(meta.lat, meta.lng, R);
    const normal = pos.clone().normalize();

    const marker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, opacity: 0,
    }));
    marker.position.copy(normal).multiplyScalar(R + 1.5);
    marker.scale.setScalar(0.001);

    // A beam that dissolves as it rises. A flat-topped cylinder reads as a
    // scratch on the screen; a gradient reads as light.
    const pillar = new THREE.Mesh(pillarGeo, new THREE.ShaderMaterial({
      uniforms: {
        uColor:   { value: new THREE.Color('#FFD98A') },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float a = pow(1.0 - vUv.y, 1.8) * uOpacity;
          gl_FragColor = vec4(uColor, a);
        }`,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    pillar.position.copy(normal).multiplyScalar(R);
    pillar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    pillar.scale.set(1, 0.001, 1);

    group.add(marker, pillar);
    out.set(name, { marker, pillar });
  }
  return { group, markers: out };
}

const ARC_VERT = /* glsl */ `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const ARC_FRAG = /* glsl */ `
  uniform vec3  uColor;
  uniform float uProgress;
  uniform float uOpacity;
  varying float vU;
  void main() {
    if (vU > uProgress) discard;
    float head = smoothstep(uProgress - 0.09, uProgress, vU);
    float tail = smoothstep(0.0, 0.28, vU);
    float a = (0.26 + head * 1.35) * tail * uOpacity;
    gl_FragColor = vec4(uColor + vec3(head * 0.55), a);
  }`;

/**
 * A great-circle arc from a country to UN Headquarters, drawn head-first.
 * Arc height scales with distance so short hops don't loop absurdly.
 */
export function makeArc(lat, lng) {
  const a = latLngToVec3(lat, lng, R);
  const b = latLngToVec3(UN_HQ.lat, UN_HQ.lng, R);
  const angle = a.angleTo(b);
  const lift = R * (0.14 + angle * 0.30);
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + lift);

  const curve = new THREE.QuadraticBezierCurve3(
    a.clone().multiplyScalar(1.005), mid, b.clone().multiplyScalar(1.005),
  );
  const geo = new THREE.TubeGeometry(curve, 72, 0.30, 6, false);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor:    { value: new THREE.Color('#5AD2FF') },
      uProgress: { value: 0 },
      uOpacity:  { value: 1 },
    },
    vertexShader: ARC_VERT,
    fragmentShader: ARC_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 2;
  return mesh;
}

/** The permanent marker at UN Headquarters, where every arc lands. */
export function makeHQMarker() {
  const pos = latLngToVec3(UN_HQ.lat, UN_HQ.lng, R + 1.5);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: markerTexture(), transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, opacity: 0,
    color: new THREE.Color('#BFE9FF'),
  }));
  sprite.position.copy(pos);
  sprite.scale.setScalar(14);
  return sprite;
}
