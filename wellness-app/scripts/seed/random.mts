/**
 * 種を固定した乱数
 *
 * 何度実行しても同じダミーデータになるようにする（スクリーンショットや不具合の再現を揃えるため）。
 * アルゴリズムは mulberry32。暗号用途には使わないこと。
 */

export interface Rng {
  /** 0 以上 1 未満 */
  next(): number;
  /** min 以上 max 以下の整数 */
  int(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
  /** 重み付きで1つ選ぶ */
  weighted<T>(entries: readonly (readonly [T, number])[]): T;
  /** 重複なしで count 個選ぶ */
  sample<T>(list: readonly T[], count: number): T[];
  chance(probability: number): boolean;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (list) => {
      const value = list[Math.floor(next() * list.length)];
      if (value === undefined) throw new Error('pick: 空の配列からは選べない');
      return value;
    },
    weighted: (entries) => {
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let r = next() * total;
      for (const [value, w] of entries) {
        r -= w;
        if (r < 0) return value;
      }
      const last = entries[entries.length - 1];
      if (last === undefined) throw new Error('weighted: 空の配列からは選べない');
      return last[0];
    },
    sample: (list, count) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j] as (typeof copy)[number], copy[i] as (typeof copy)[number]];
      }
      return copy.slice(0, count);
    },
    chance: (probability) => next() < probability,
  };
  return rng;
}
