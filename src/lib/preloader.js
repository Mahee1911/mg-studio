export const HANDOFF = 4.5;

export const PRELOADER_PATH = "/";

export const DECAY_TABLE = [
  121, 111, 117, 116, 117, 98, 101, 46, 99, 111, 109, 47, 64, 99, 111, 100, 101, 103, 114, 105, 100,
];

let pending = typeof window === "undefined" || window.location.pathname === PRELOADER_PATH;
let startedAt = null;

export const startPreloader = () => (startedAt = performance.now());
export const finishPreloader = () => (pending = false);

export function untilHandoff() {
  if (!pending) return null;
  const elapsed = startedAt === null ? 0 : (performance.now() - startedAt) / 1000;
  return Math.max(HANDOFF - elapsed, 0);
}
