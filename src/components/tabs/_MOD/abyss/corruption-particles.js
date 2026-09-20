export const CORRUPTION_BURST_DURATION = 1350;

const CAMERA_DISTANCE = 90;
const ORBITS = Array.from({ length: 6 }, (_, index) => ({
  phase: index * Math.PI / 3,
  radius: 24 + index % 3 * 2,
  tilt: (index % 2 === 0 ? 1 : -1) * (50 + index % 3 * 8) * Math.PI / 180,
  rotation: (index % 3 * 60 - 25) * Math.PI / 180,
  period: 6400 + index % 3 * 900,
  size: 0.85 + index % 3 * 0.15,
}));

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function orbitExpansion(elapsed) {
  if (elapsed === null) return 0;
  if (elapsed < 300) return 8 * smoothstep(elapsed / 300);
  if (elapsed < 450) return 8;
  if (elapsed < 1100) return 8 - 9.5 * smoothstep((elapsed - 450) / 650);
  return -1.5 * (1 - smoothstep((elapsed - 1100) / 250));
}

function project(x, y, z) {
  const scale = CAMERA_DISTANCE / (CAMERA_DISTANCE - z);
  return { x: 20 + x * scale, y: 20 + y * scale, z, scale };
}

export function corruptionOrbitParticles(time, burstElapsed = null) {
  const expansion = orbitExpansion(burstElapsed);
  return ORBITS.map((orbit, id) => {
    const angle = orbit.phase + time / orbit.period * 2 * Math.PI;
    const radius = orbit.radius + expansion;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * Math.cos(orbit.tilt);
    const z = Math.sin(angle) * radius * Math.sin(orbit.tilt);
    const position = project(
      x * Math.cos(orbit.rotation) - y * Math.sin(orbit.rotation),
      x * Math.sin(orbit.rotation) + y * Math.cos(orbit.rotation),
      z
    );
    return {
      id,
      ...position,
      radius: orbit.size * position.scale,
      opacity: 0.65 + 0.3 * Math.max(-1, Math.min(1, z / radius)),
    };
  }).sort((a, b) => a.z - b.z);
}

export function corruptionEscapeParticles(elapsed) {
  if (elapsed === null) return [];
  const particles = [];
  for (let id = 0; id < 9; id++) {
    const progress = (elapsed - id % 3 * 35) / 850;
    if (progress < 0 || progress >= 1) continue;
    const distance = (30 + id % 3 * 6) * (1 - (1 - progress) ** 3);
    const angle = id * 2 * Math.PI / 9 + 0.2;
    const position = project(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance,
      Math.sin(id * 2.4) * distance * 0.4
    );
    particles.push({
      id,
      ...position,
      radius: (1.2 - 0.8 * progress) * position.scale,
      opacity: (1 - progress) ** 2,
    });
  }
  return particles.sort((a, b) => a.z - b.z);
}
