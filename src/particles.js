// ═══════════════════════════════════════════════════════════════════════════
//  The particle field.
//
//  ~16,000 points of light are created once at boot and never destroyed. They
//  form the PGA81 logo, then the Earth, then the country ignitions, then the
//  logo again. Morphing happens entirely on the GPU: we hand the shader a
//  "from" and a "to" position per particle and tween a single uniform, so a
//  full-field transformation costs one uniform write per frame.
//
//  Ignition is also GPU-side. Each particle carries the timestamp at which its
//  country lights up; the shader derives the flash and the permanent highlight
//  from that. Lighting a country is one array write, not a per-frame animation.
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from '../vendor/three.module.js';

const VERT = /* glsl */ `
  precision highp float;

  attribute vec3  aFrom;
  attribute vec3  aTo;
  attribute vec3  aColorFrom;
  attribute vec3  aColorTo;
  attribute float aDelay;       // 0..1 — staggers the morph across the field
  attribute float aSeed;        // 0..1 — per-particle randomness
  attribute float aScale;       // relative point size
  attribute float aIgniteTime;  // seconds on the uTime clock; NEVER = never

  uniform float uMorph;         // 0..1 master morph
  uniform float uStagger;       // 0..1 how much of the timeline the stagger eats
  uniform float uTime;
  uniform float uSize;
  uniform float uCurl;          // how far particles bow out of a straight path
  uniform float uOpacity;
  uniform float uPixelRatio;
  uniform float uDrift;
  uniform float uFadeRadius;    // half-depth of the current shape
  uniform float uFadeAmount;    // 0 = no depth fade, 1 = full
  uniform vec3  uLitColor;
  uniform vec3  uFlareColor;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vFlare;

  // Smooth, slightly overshoot-free ease. Matches GSAP power3.out closely.
  float ease(float t) {
    return 1.0 - pow(1.0 - t, 3.0);
  }

  void main() {
    // Per-particle slice of the master morph.
    float span = max(1.0 - uStagger, 0.0001);
    float t = clamp((uMorph - aDelay * uStagger) / span, 0.0, 1.0);
    t = ease(t);

    vec3 pos = mix(aFrom, aTo, t);

    // Bow the path so the field swirls into shape instead of sliding flatly.
    vec3 axis = normalize(cross(aTo - aFrom, vec3(0.0, 0.0, 1.0)) + vec3(0.0001));
    pos += axis * sin(t * 3.14159) * uCurl * (aSeed - 0.5) * 2.0;

    // Never perfectly still — a slow breath keeps the field alive.
    float ph = aSeed * 62.83;
    pos += vec3(sin(uTime * 0.6 + ph), cos(uTime * 0.5 + ph * 1.3), sin(uTime * 0.4 + ph * 0.7)) * uDrift;

    vec3 col = mix(aColorFrom, aColorTo, t);

    // Ignition: a flash that decays into a permanent highlight.
    float flare = 0.0;
    // The sentinel is far below any real timestamp, so an ignition may sit in
    // the past — that is how a jumped-to scene shows countries already lit
    // rather than flashing them all at once.
    if (aIgniteTime > -1.0e8 && uTime >= aIgniteTime) {
      float dt = uTime - aIgniteTime;
      flare = exp(-dt * 2.4);
      col = mix(col, uLitColor, smoothstep(0.0, 0.55, dt));
      col += uFlareColor * flare * 1.6;
    }
    vFlare = flare;
    vColor = col;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * aScale * (1.0 + flare * 2.6);
    gl_PointSize = size * uPixelRatio * (430.0 / -mv.z);

    // Fade the far side of the shape so a sphere reads as a solid body rather
    // than a transparent shell. Measured relative to the group's own centre,
    // not to the camera, so it holds at any camera distance.
    float centerZ = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
    float rel = (mv.z - centerZ) / uFadeRadius;
    vAlpha = uOpacity * mix(1.0, smoothstep(-1.25, 0.15, rel), uFadeAmount);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vFlare;

  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = dot(d, d) * 4.0;
    if (r > 1.0) discard;

    // Soft core with a wide halo — reads as light, not as a dot.
    float core = pow(1.0 - r, 2.4);
    float halo = pow(1.0 - r, 0.8) * 0.32;
    float a = (core + halo) * vAlpha;
    if (a < 0.002) discard;

    gl_FragColor = vec4(vColor, a);
  }
`;

/** Sentinel for "this particle never ignites". */
const NEVER = -1.0e9;

export class ParticleField {
  /** @param {number} count total particles */
  constructor(count) {
    this.count = count;

    const geo = new THREE.BufferGeometry();
    const zeros3 = () => new Float32Array(count * 3);

    this.aFrom = zeros3();
    this.aTo = zeros3();
    this.aColorFrom = zeros3();
    this.aColorTo = zeros3();
    this.aDelay = new Float32Array(count);
    this.aSeed = new Float32Array(count);
    this.aScale = new Float32Array(count);
    this.aIgniteTime = new Float32Array(count).fill(NEVER);

    for (let i = 0; i < count; i++) {
      this.aSeed[i] = Math.random();
      this.aDelay[i] = Math.random();
      this.aScale[i] = 0.75 + Math.random() * 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(zeros3(), 3)); // unused; keeps three happy
    geo.setAttribute('aFrom', new THREE.BufferAttribute(this.aFrom, 3));
    geo.setAttribute('aTo', new THREE.BufferAttribute(this.aTo, 3));
    geo.setAttribute('aColorFrom', new THREE.BufferAttribute(this.aColorFrom, 3));
    geo.setAttribute('aColorTo', new THREE.BufferAttribute(this.aColorTo, 3));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(this.aDelay, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(this.aSeed, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(this.aScale, 1));
    geo.setAttribute('aIgniteTime', new THREE.BufferAttribute(this.aIgniteTime, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 500);

    this.uniforms = {
      uMorph:      { value: 1 },
      uStagger:    { value: 0.55 },
      uTime:       { value: 0 },
      uSize:       { value: 2.6 },
      uCurl:       { value: 0 },
      uOpacity:    { value: 1 },
      uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
      uDrift:      { value: 0.25 },
      uFadeRadius: { value: 420 },
      uFadeAmount: { value: 0.3 },
      uLitColor:   { value: new THREE.Color('#F2B233') },
      uFlareColor: { value: new THREE.Color('#FFF3D4') },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.geometry = geo;
  }

  /**
   * Stage the next shape. Pass positions/colors as flat Float32Arrays of
   * length count*3. Call morph() afterwards to animate into it.
   */
  setTarget(positions, colors) {
    this.aTo.set(positions);
    this.aColorTo.set(colors);
    this.geometry.attributes.aTo.needsUpdate = true;
    this.geometry.attributes.aColorTo.needsUpdate = true;
  }

  /** Freeze the current target as the new starting point, ready for the next morph. */
  commit() {
    this.aFrom.set(this.aTo);
    this.aColorFrom.set(this.aColorTo);
    this.geometry.attributes.aFrom.needsUpdate = true;
    this.geometry.attributes.aColorFrom.needsUpdate = true;
    this.uniforms.uMorph.value = 0;
  }

  /** Reshuffle which particles move first — keeps repeated morphs from rhyming. */
  reshuffleStagger() {
    for (let i = 0; i < this.count; i++) this.aDelay[i] = Math.random();
    this.geometry.attributes.aDelay.needsUpdate = true;
  }

  /**
   * Light a set of particles at a moment in time. `at` is on the same clock as
   * uniforms.uTime. The shader turns this into a flash plus a lasting highlight.
   */
  ignite(indices, at) {
    for (const i of indices) this.aIgniteTime[i] = at;
    this.geometry.attributes.aIgniteTime.needsUpdate = true;
  }

  /** Put every particle back to unlit. */
  clearIgnitions() {
    this.aIgniteTime.fill(NEVER);
    this.geometry.attributes.aIgniteTime.needsUpdate = true;
  }

  update(elapsed) {
    this.uniforms.uTime.value = elapsed;
  }

  onResize() {
    this.uniforms.uPixelRatio.value = Math.min(devicePixelRatio, 2);
  }
}

// ── Shape generators ────────────────────────────────────────────────────────
// Each returns { positions, colors } sized for the field.

/**
 * Sample a PNG's opaque pixels into particle positions, so the logo is
 * reproduced exactly rather than approximated by hand-drawn vectors.
 */
export async function sampleImage(url, count, {
  width = 260, alphaMin = 128, targetHeight = 150,
} = {}) {
  const img = await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`Could not load ${url}`));
    im.src = url;
  });

  const h = Math.round((img.height / img.width) * width);
  const cv = document.createElement('canvas');
  cv.width = width; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, h);
  const px = ctx.getImageData(0, 0, width, h).data;

  // The mark is white-on-blue: collect the WHITE pixels, which are the
  // building and the numerals — the shapes we actually want to draw.
  const hits = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (px[i + 3] < alphaMin) continue;
      const lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
      if (lum > 0.72) hits.push([x, y]);
    }
  }

  if (!hits.length) throw new Error(`No sampleable pixels in ${url}`);

  // Frame on the ink, not on the image. The mark sits off-centre inside its
  // own square canvas, so centring on the file would hang it off to one side.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of hits) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const scale = targetHeight / Math.max(maxY - minY, 1);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const [x, y] = hits[(Math.random() * hits.length) | 0];
    // Centred on the ink, y-up, jittered within the pixel so edges stay soft.
    positions[i * 3]     = (x + Math.random() - 0.5 - cx) * scale;
    positions[i * 3 + 1] = (cy - y - Math.random() + 0.5) * scale;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;

    // A cool-to-warm gradient across the mark gives it depth without texture.
    const t = 1 - (y - minY) / Math.max(maxY - minY, 1);
    c.setHSL(0.545 - t * 0.02, 0.62 + t * 0.2, 0.58 + t * 0.16);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  return {
    positions, colors,
    width: (maxX - minX) * scale,
    height: (maxY - minY) * scale,
  };
}

/** A loose sphere of dust — the resting state between shapes. */
export function nebula(count, radius = 190, spread = 0.55) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = radius * (1 + (Math.random() - 0.5) * spread);
    const s = Math.sqrt(1 - u * u);
    positions[i * 3]     = r * s * Math.cos(th);
    positions[i * 3 + 1] = r * s * Math.sin(th);
    positions[i * 3 + 2] = r * u;
    c.setHSL(0.545, 0.7, 0.28 + Math.random() * 0.3);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  return { positions, colors };
}

/** Everything rushing in from far off-screen — the very first frame. */
export function scatter(count, radius = 900) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = radius * (0.6 + Math.random() * 0.8);
    const s = Math.sqrt(1 - u * u);
    positions[i * 3]     = r * s * Math.cos(th);
    positions[i * 3 + 1] = r * s * Math.sin(th);
    positions[i * 3 + 2] = r * u - 300;
    colors[i * 3] = 0.0; colors[i * 3 + 1] = 0.35; colors[i * 3 + 2] = 0.55;
  }
  return { positions, colors };
}
