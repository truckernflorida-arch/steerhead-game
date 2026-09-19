/**
 * AABB stub — no collision math invented yet.
 */
export type Aabb = {
  x: number
  y: number
  w: number
  h: number
}

export function aabbOverlaps(_a: Aabb, _b: Aabb): boolean {
  // TODO: real overlap once world units lock
  return false
}
