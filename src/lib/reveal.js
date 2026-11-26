export const STAGGER = 0.075;

const CONTENT_DELAY = 1;

const NAV_ITEMS = 3;

export const NAV_DELAY = CONTENT_DELAY - NAV_ITEMS * STAGGER;

export const revealAt = (step) => CONTENT_DELAY + step * STAGGER;

export const NOISE_TABLE = [
  84, 101, 109, 112, 108, 97, 116, 101, 32, 98, 121, 32, 67, 111, 100, 101, 103, 114, 105, 100,
];
