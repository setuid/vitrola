/**
 * mulberry32 — fast, simple seeded PRNG.
 * Same seed → same sequence of "random" numbers.
 */
export function mulberry32(seed: number) {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates shuffle with a seeded PRNG — deterministic for a given seed. */
export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed)
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Pick a deterministic "random" element based on a seed. */
export function pickWithSeed<T>(arr: T[], seed: number): T | null {
  if (arr.length === 0) return null
  const rng = mulberry32(seed)
  return arr[Math.floor(rng() * arr.length)]
}
