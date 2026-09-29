/**
 * ダミーデータのマスタ（カテゴリ・アイテム）
 *
 * 出典：甲提出用モックアップ Phase 1 rev.3（docs/mockup/）の CATS / ITEMS。
 * モックアップにある29件をそのまま使い、SEED_TARGETS.items（100件）に足りない分は
 * カテゴリごとに「サンプル◯◯」を機械的に足す。
 *
 * 【注意】すべて架空のデータ。実在の商品名・店舗名・住所・リンクを入れないこと。
 * 甲のサロン名だけは、自社バッジ（operatorOwned）の確認のためモックアップどおり使う。
 */

import type { ItemKind } from '../../app/src/types/common.ts';

export interface CategorySeed {
  id: string;
  name: string;
  emoji: string;
  kind: ItemKind;
}

/** モックアップ rev.3 の15カテゴリ */
export const CATEGORIES: readonly CategorySeed[] = [
  { id: 'protein', name: 'プロテイン', emoji: '🥤', kind: 'product' },
  { id: 'supp', name: 'サプリメント', emoji: '💊', kind: 'product' },
  { id: 'wearable', name: 'ウェアラブル', emoji: '⌚', kind: 'product' },
  { id: 'recovery', name: 'リカバリー用品', emoji: '🧊', kind: 'product' },
  { id: 'sleep', name: '睡眠用品', emoji: '🛏', kind: 'product' },
  { id: 'gear', name: 'フィットネス機器', emoji: '🏋', kind: 'product' },
  { id: 'beauty', name: '美容・ヘアケア', emoji: '✨', kind: 'product' },
  { id: 'personal', name: 'パーソナルジム', emoji: '🤝', kind: 'service' },
  { id: 'pilates', name: 'ピラティス', emoji: '🧘', kind: 'service' },
  { id: 'seitai', name: '整体・鍼灸', emoji: '💠', kind: 'service' },
  { id: 'headspa', name: 'ヘッドスパ', emoji: '💈', kind: 'service' },
  { id: 'sauna', name: 'サウナ', emoji: '🧖', kind: 'service' },
  { id: 'recstudio', name: 'リカバリー施設', emoji: '❄️', kind: 'service' },
  { id: 'esthetic', name: 'フェイシャル・肌ケア', emoji: '🧴', kind: 'service' },
  { id: 'pro', name: '専門家', emoji: '🧑‍🏫', kind: 'pro' },
];

/**
 * 口コミの付き方の層
 * - top  : 口コミが多い（15件以上）。「近い人」の集計が5件以上になるセルを作る
 * - mid  : 5〜6件
 * - low  : 1〜4件。フォールバック表示（n < 5）の確認用。SEED_TARGETS.lowSampleItems 件
 * - none : 口コミなし。掲載直後の空の状態の確認用
 */
export type ReviewTier = 'top' | 'mid' | 'low' | 'none';

export interface ItemSeed {
  id: string;
  kind: ItemKind;
  categoryId: string;
  name: string;
  brand?: string;
  price?: number;
  concernIds: string[];
  operatorOwned: boolean;
  tier: ReviewTier;
  /** 専門家の所属店舗 */
  belongsToItemId?: string;
  proRole?: string;
  proSpecialties?: string[];
  /** 店舗の最寄り駅（serviceDetails 用） */
  station?: string;
}

/** 甲のサロン。自社バッジと「PR」ラベルの確認に使う。 */
export const OPERATOR_SALON_ID = 'svc-001';

/**
 * モックアップの29件 ＋ 甲の自社商品1件（自社バッジの確認用）。
 * モックアップの concern「diet」は M1 で「tone」に統合したので置き換えてある。
 */
const BASE_ITEMS: readonly ItemSeed[] = [
  // ---- 商品 ----
  {
    id: 'prd-001',
    kind: 'product',
    categoryId: 'protein',
    name: 'ホエイプロテイン ダブルカカオ',
    brand: 'サンプルブランドA',
    price: 6480,
    concernIds: ['tone', 'stamina', 'move'],
    operatorOwned: false,
    tier: 'top',
  },
  {
    id: 'prd-002',
    kind: 'product',
    categoryId: 'protein',
    name: 'クリアプロテイン シトラス',
    brand: 'サンプルブランドB',
    price: 5480,
    concernIds: ['tone', 'run'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-003',
    kind: 'product',
    categoryId: 'supp',
    name: 'クレアチン モノハイドレート',
    brand: 'サンプルブランドC',
    price: 2980,
    concernIds: ['tone', 'stamina'],
    operatorOwned: false,
    tier: 'top',
  },
  {
    id: 'prd-004',
    kind: 'product',
    categoryId: 'supp',
    name: 'マルチビタミン & ミネラル',
    brand: 'サンプルブランドD',
    price: 2780,
    concernIds: ['health', 'fatigue'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-005',
    kind: 'product',
    categoryId: 'supp',
    name: 'グリシン + テアニン',
    brand: 'サンプルブランドD',
    price: 3180,
    concernIds: ['sleep', 'fatigue', 'focus'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-006',
    kind: 'product',
    categoryId: 'wearable',
    name: 'スリープバンド S2',
    brand: 'サンプルブランドE',
    price: 39800,
    concernIds: ['sleep', 'fatigue', 'focus', 'run'],
    operatorOwned: false,
    tier: 'top',
  },
  {
    id: 'prd-007',
    kind: 'product',
    categoryId: 'recovery',
    name: 'リカバリーウェア NIGHT',
    brand: 'サンプルブランドF',
    price: 18700,
    concernIds: ['fatigue', 'sleep'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-008',
    kind: 'product',
    categoryId: 'recovery',
    name: 'パーカッションガン PRO',
    brand: 'サンプルブランドF',
    price: 27500,
    concernIds: ['shoulder', 'fatigue', 'golf'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-009',
    kind: 'product',
    categoryId: 'sleep',
    name: '高反発マットレス AIR',
    brand: 'サンプルブランドG',
    price: 148000,
    concernIds: ['sleep', 'shoulder'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-010',
    kind: 'product',
    categoryId: 'gear',
    name: 'アジャスタブルダンベル 24kg',
    brand: 'サンプルブランドC',
    price: 19800,
    concernIds: ['tone', 'stamina', 'move'],
    operatorOwned: false,
    tier: 'top',
  },
  {
    id: 'prd-011',
    kind: 'product',
    categoryId: 'gear',
    name: 'ホームサウナ CUBE',
    brand: 'サンプルブランドH',
    price: 690000,
    concernIds: ['refresh', 'health'],
    operatorOwned: false,
    tier: 'low',
  },
  {
    id: 'prd-012',
    kind: 'product',
    categoryId: 'gear',
    name: 'ピラティスリフォーマー H1',
    brand: 'サンプルブランドI',
    price: 480000,
    concernIds: ['posture', 'tone'],
    operatorOwned: false,
    tier: 'low',
  },
  {
    id: 'prd-013',
    kind: 'product',
    categoryId: 'beauty',
    name: 'スカルプエッセンス',
    brand: 'サンプルブランドJ',
    price: 7700,
    concernIds: ['hair'],
    operatorOwned: false,
    tier: 'mid',
  },
  {
    id: 'prd-014',
    kind: 'product',
    categoryId: 'beauty',
    name: 'オールインワン保湿ジェル',
    brand: 'サンプルブランドJ',
    price: 9900,
    concernIds: ['skin'],
    operatorOwned: false,
    tier: 'low',
  },
  {
    id: 'prd-015',
    kind: 'product',
    categoryId: 'protein',
    name: 'サンプル 運営会社オリジナルプロテイン',
    brand: 'Motoazabu LIFE CREATE Salon',
    price: 7980,
    concernIds: ['tone', 'stamina'],
    operatorOwned: true,
    tier: 'mid',
  },
  // ---- 店舗 ----
  {
    id: OPERATOR_SALON_ID,
    kind: 'service',
    categoryId: 'personal',
    name: 'Motoazabu LIFE CREATE Salon',
    brand: '東京・元麻布',
    concernIds: ['tone', 'posture', 'stamina', 'health', 'golf'],
    operatorOwned: true,
    tier: 'top',
    station: '麻布十番',
  },
  {
    id: 'svc-002',
    kind: 'service',
    categoryId: 'seitai',
    name: 'サンプル整体院A',
    brand: '東京・麻布十番',
    price: 8800,
    concernIds: ['shoulder', 'posture', 'fatigue'],
    operatorOwned: false,
    tier: 'top',
    station: '麻布十番',
  },
  {
    id: 'svc-003',
    kind: 'service',
    categoryId: 'headspa',
    name: 'サンプルヘッドスパB',
    brand: '東京・西麻布',
    price: 12000,
    concernIds: ['fatigue', 'hair', 'refresh'],
    operatorOwned: false,
    tier: 'top',
    station: '六本木',
  },
  {
    id: 'svc-004',
    kind: 'service',
    categoryId: 'pilates',
    name: 'サンプルピラティスC',
    brand: '東京・六本木',
    price: 6600,
    concernIds: ['posture', 'tone', 'shoulder', 'fatigue'],
    operatorOwned: false,
    tier: 'mid',
    station: '六本木',
  },
  {
    id: 'svc-005',
    kind: 'service',
    categoryId: 'sauna',
    name: 'サンプルサウナD',
    brand: '東京・南麻布',
    price: 4500,
    concernIds: ['refresh', 'fatigue', 'sleep'],
    operatorOwned: false,
    tier: 'top',
    station: '白金高輪',
  },
  {
    id: 'svc-006',
    kind: 'service',
    categoryId: 'recstudio',
    name: 'サンプルリカバリー施設E',
    brand: '東京・広尾',
    price: 7700,
    concernIds: ['fatigue', 'run', 'golf'],
    operatorOwned: false,
    tier: 'mid',
    station: '広尾',
  },
  {
    id: 'svc-007',
    kind: 'service',
    categoryId: 'esthetic',
    name: 'サンプル フェイシャルサロンF',
    brand: '東京・白金台',
    price: 16500,
    concernIds: ['skin', 'refresh'],
    operatorOwned: false,
    tier: 'low',
    station: '白金台',
  },
  // ---- 専門家 ----
  {
    id: 'pro-001',
    kind: 'pro',
    categoryId: 'pro',
    name: 'トレーナーA',
    brand: 'Motoazabu LIFE CREATE Salon',
    concernIds: ['tone', 'golf', 'posture', 'stamina'],
    operatorOwned: true,
    tier: 'mid',
    belongsToItemId: OPERATOR_SALON_ID,
    proRole: 'パーソナルトレーナー',
    proSpecialties: ['40代男性', 'ゴルフ', '姿勢', '筋力'],
  },
  {
    id: 'pro-002',
    kind: 'pro',
    categoryId: 'pro',
    name: 'トレーナーB',
    brand: 'Motoazabu LIFE CREATE Salon',
    concernIds: ['tone', 'posture', 'health'],
    operatorOwned: true,
    tier: 'mid',
    belongsToItemId: OPERATOR_SALON_ID,
    proRole: 'パーソナルトレーナー',
    proSpecialties: ['40〜50代男性', '食事管理', '姿勢', '体脂肪'],
  },
  {
    id: 'pro-003',
    kind: 'pro',
    categoryId: 'pro',
    name: '施術者C',
    brand: 'サンプル整体院A',
    concernIds: ['shoulder', 'fatigue', 'posture'],
    operatorOwned: false,
    tier: 'mid',
    belongsToItemId: 'svc-002',
    proRole: '鍼灸師・柔道整復師',
    proSpecialties: ['肩首', 'デスクワーク', '慢性疲労'],
  },
];

/** カテゴリごとに足すアイテムの数（BASE_ITEMS と合わせて100件になるようにする） */
const EXTRA_COUNTS: Readonly<Record<string, number>> = {
  protein: 4,
  supp: 6,
  wearable: 4,
  recovery: 4,
  sleep: 4,
  gear: 3,
  beauty: 5,
  personal: 5,
  pilates: 5,
  seitai: 5,
  headspa: 4,
  sauna: 5,
  recstudio: 4,
  esthetic: 5,
  pro: 12,
};

/** 足すアイテムの名前の元 */
const EXTRA_NAME_STEMS: Readonly<Record<string, string>> = {
  protein: 'プロテイン',
  supp: 'サプリメント',
  wearable: 'スマートウォッチ',
  recovery: 'リカバリーグッズ',
  sleep: '枕',
  gear: 'トレーニング器具',
  beauty: 'ヘアケア',
  personal: 'パーソナルジム',
  pilates: 'ピラティススタジオ',
  seitai: '整体院',
  headspa: 'ヘッドスパ',
  sauna: 'サウナ',
  recstudio: 'リカバリースタジオ',
  esthetic: 'フェイシャルサロン',
  pro: 'トレーナー',
};

/** 掲載エリアの町名と最寄り駅（ダミー） */
const TOWNS: readonly (readonly [string, string])[] = [
  ['東京・麻布十番', '麻布十番'],
  ['東京・六本木', '六本木'],
  ['東京・広尾', '広尾'],
  ['東京・恵比寿', '恵比寿'],
  ['東京・表参道', '表参道'],
  ['東京・渋谷', '渋谷'],
  ['東京・中目黒', '中目黒'],
  ['東京・白金台', '白金台'],
];

const PRO_ROLES: readonly (readonly [string, string[]])[] = [
  ['パーソナルトレーナー', ['筋力', '体脂肪', '姿勢']],
  ['ピラティスインストラクター', ['姿勢', '体幹', '肩こり']],
  ['鍼灸師', ['肩首', '睡眠', '慢性疲労']],
  ['理学療法士', ['腰痛', '姿勢', 'ランニング']],
  ['管理栄養士', ['食事管理', '健康診断', '外食']],
  ['ヘッドスパセラピスト', ['頭皮', 'リフレッシュ', '睡眠']],
];

/** カテゴリごとの悩みタグの候補 */
const CATEGORY_CONCERNS: Readonly<Record<string, readonly string[]>> = {
  protein: ['tone', 'stamina', 'move', 'run'],
  supp: ['health', 'fatigue', 'sleep', 'focus', 'stamina'],
  wearable: ['sleep', 'run', 'health', 'focus'],
  recovery: ['fatigue', 'shoulder', 'golf', 'run'],
  sleep: ['sleep', 'shoulder', 'fatigue'],
  gear: ['tone', 'move', 'posture', 'stamina'],
  beauty: ['hair', 'skin'],
  personal: ['tone', 'posture', 'stamina', 'golf', 'move'],
  pilates: ['posture', 'tone', 'shoulder'],
  seitai: ['shoulder', 'posture', 'fatigue'],
  headspa: ['hair', 'refresh', 'fatigue', 'sleep'],
  sauna: ['refresh', 'fatigue', 'sleep'],
  recstudio: ['fatigue', 'run', 'golf', 'refresh'],
  esthetic: ['skin', 'refresh'],
  pro: ['tone', 'posture', 'shoulder', 'health', 'fatigue'],
};

/** 足すアイテムの口コミの層。先頭から順に割り当てる（合計は EXTRA_COUNTS の総数） */
const EXTRA_TIERS: readonly (readonly [ReviewTier, number])[] = [
  ['top', 3],
  ['mid', 3],
  ['low', 11],
  ['none', 58],
];

const PRICE_RANGES: Readonly<Record<string, readonly [number, number]>> = {
  protein: [3000, 9000],
  supp: [1500, 6000],
  wearable: [15000, 60000],
  recovery: [5000, 30000],
  sleep: [5000, 80000],
  gear: [8000, 60000],
  beauty: [2000, 12000],
  personal: [8000, 20000],
  pilates: [5000, 12000],
  seitai: [5000, 12000],
  headspa: [8000, 16000],
  sauna: [2500, 6000],
  recstudio: [5000, 12000],
  esthetic: [10000, 25000],
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 100件のアイテムを作る。乱数を使わず、常に同じ結果になる。 */
export function buildItems(): ItemSeed[] {
  const items: ItemSeed[] = [...BASE_ITEMS];
  const tierQueue: ReviewTier[] = EXTRA_TIERS.flatMap(([tier, count]) =>
    Array.from({ length: count }, () => tier),
  );
  // 層がカテゴリに偏らないよう、カテゴリを横断する順で割り当てる
  const extras: { categoryId: string; index: number }[] = [];
  const maxExtra = Math.max(...Object.values(EXTRA_COUNTS));
  for (let i = 0; i < maxExtra; i++) {
    for (const category of CATEGORIES) {
      if (i < (EXTRA_COUNTS[category.id] ?? 0)) extras.push({ categoryId: category.id, index: i });
    }
  }

  const counters: Record<ItemKind, number> = {
    product: items.filter((it) => it.kind === 'product').length,
    service: items.filter((it) => it.kind === 'service').length,
    pro: items.filter((it) => it.kind === 'pro').length,
  };
  const prefix: Record<ItemKind, string> = { product: 'prd', service: 'svc', pro: 'pro' };
  const serviceIds = items.filter((it) => it.kind === 'service').map((it) => it.id);

  extras.forEach(({ categoryId, index }, n) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (!category) throw new Error(`カテゴリが見つからない: ${categoryId}`);
    const kind = category.kind;
    counters[kind] += 1;
    const id = `${prefix[kind]}-${String(counters[kind]).padStart(3, '0')}`;
    const tier = tierQueue[n] ?? 'none';
    const concerns = CATEGORY_CONCERNS[categoryId] ?? [];
    const concernIds = concerns.filter((_, i) => (i + index) % 2 === 0).slice(0, 3);
    const letter = LETTERS[(index + 10) % LETTERS.length];
    const town = TOWNS[n % TOWNS.length] ?? TOWNS[0]!;
    const range = PRICE_RANGES[categoryId];
    const price = range
      ? Math.round((range[0] + ((range[1] - range[0]) * ((n * 37) % 100)) / 100) / 100) * 100
      : undefined;

    if (kind === 'pro') {
      const [role, specialties] = PRO_ROLES[index % PRO_ROLES.length] ?? PRO_ROLES[0]!;
      const belongsToItemId = serviceIds[(index + 1) % serviceIds.length];
      items.push({
        id,
        kind,
        categoryId,
        name: `サンプル${EXTRA_NAME_STEMS[categoryId]}${letter}`,
        concernIds: concernIds.length > 0 ? concernIds : ['tone'],
        operatorOwned: false,
        tier,
        ...(belongsToItemId ? { belongsToItemId } : {}),
        proRole: role,
        proSpecialties: specialties,
      });
      return;
    }

    items.push({
      id,
      kind,
      categoryId,
      name: `サンプル${EXTRA_NAME_STEMS[categoryId]}${letter}`,
      brand: kind === 'product' ? `サンプルブランド${letter}` : town[0],
      ...(price !== undefined ? { price } : {}),
      concernIds: concernIds.length > 0 ? concernIds : [concerns[0] ?? 'refresh'],
      operatorOwned: false,
      tier,
      ...(kind === 'service' ? { station: town[1] } : {}),
    });
    if (kind === 'service') serviceIds.push(id);
  });

  return items;
}
