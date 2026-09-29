/**
 * ダミーデータの生成（ユーザー・口コミ・コラム・お知らせ）
 *
 * 【方針】CLAUDE.md §9-4 と SEED_TARGETS に従う。
 * - 投稿者の男女比は 8:2。母数を厚くするのは 30s_m / 40s_m / 50s_m
 * - フォールバック表示の確認のため、口コミ1〜4件のアイテムを SEED_TARGETS.lowSampleItems 件作る
 * - 口コミは本番の初期口コミと同じく、全件 postingCategory = 'requested'
 * - 退会済みユーザーの口コミ（匿名化済み）も混ぜる（TODO-A の表示確認）
 * - 写真は Storage を用意していないため空にする
 */

import {
  type AgeBand,
  type Area,
  cohortKey,
  type ExerciseFreq,
  type Gender,
} from '../../app/src/types/common.ts';
import type { Column, Notice } from '../../app/src/types/content.ts';
import type { Concern } from '../../app/src/types/item.ts';
import type {
  AuthorSnapshot,
  DiscoverySource,
  PurchaseSource,
  Review,
} from '../../app/src/types/review.ts';
import type { User } from '../../app/src/types/user.ts';
import {
  INITIAL_CONCERNS,
  REVIEW_MIN_TEXT_LENGTH,
  SEED_TARGETS,
  WITHDRAWN_NICKNAME,
} from '../../app/src/types/constants.ts';
import { buildItems, type ItemSeed } from './master.mts';
import { createRng, type Rng } from './random.mts';

/** 生成の基準日。createdAt などはこの日から過去にさかのぼって作る。 */
export const SEED_NOW = Date.UTC(2026, 8, 29, 3, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

/** Auth Emulator にも作るテスト用アカウント */
export const TEST_ACCOUNTS = {
  user: { uid: 'test-user', email: 'test@example.com', password: 'password123' },
  admin: { uid: 'test-admin', email: 'admin@example.com', password: 'password123' },
} as const;

export interface SeedData {
  concerns: Concern[];
  items: ItemSeed[];
  users: User[];
  /** 退会済み（users に存在しない）投稿者の数 */
  withdrawnAuthorCount: number;
  reviews: Review[];
  favorites: { uid: string; itemId: string; createdAt: number }[];
  columns: Column[];
  notices: Notice[];
}

// ---------------------------------------------------------------------------
// ユーザー
// ---------------------------------------------------------------------------

const MALE_AGE_WEIGHTS: readonly (readonly [AgeBand, number])[] = [
  ['20s', 0.08],
  ['30s', 0.3],
  ['40s', 0.37],
  ['50s', 0.2],
  ['60s+', 0.05],
];
const FEMALE_AGE_WEIGHTS: readonly (readonly [AgeBand, number])[] = [
  ['20s', 0.25],
  ['30s', 0.35],
  ['40s', 0.25],
  ['50s', 0.1],
  ['60s+', 0.05],
];
const EXERCISE_WEIGHTS: readonly (readonly [ExerciseFreq, number])[] = [
  ['none', 0.15],
  ['w1', 0.3],
  ['w2_3', 0.4],
  ['w4plus', 0.15],
];

/** 市区町村コード（全国地方公共団体コードの先頭5桁） */
const AREA_WEIGHTS: readonly (readonly [Area | null, number])[] = [
  [{ prefecture: '13', municipality: '13103' }, 0.22], // 港区
  [{ prefecture: '13', municipality: '13113' }, 0.12], // 渋谷区
  [{ prefecture: '13', municipality: '13110' }, 0.08], // 目黒区
  [{ prefecture: '13', municipality: '13112' }, 0.08], // 世田谷区
  [{ prefecture: '13', municipality: '13109' }, 0.05], // 品川区
  [{ prefecture: '13', municipality: '13101' }, 0.04], // 千代田区
  [{ prefecture: '13', municipality: '13102' }, 0.04], // 中央区
  [{ prefecture: '13', municipality: '13104' }, 0.04], // 新宿区
  [{ prefecture: '14', municipality: null }, 0.1], // 神奈川県
  [{ prefecture: '11', municipality: null }, 0.04], // 埼玉県
  [{ prefecture: '12', municipality: null }, 0.04], // 千葉県
  [null, 0.15], // 未入力
];

const MALE_NAMES = [
  'kenta',
  'ryo',
  'masa',
  'dai',
  'shin',
  'taku',
  'yuji',
  'hiro',
  'sho',
  'koji',
  'naoki',
  'tomo',
  'jun',
  'kazu',
  'satoshi',
  'yusuke',
  'makoto',
  'ken',
  'akira',
  'toru',
];
const FEMALE_NAMES = ['yuka', 'mai', 'aya', 'emi', 'saki', 'nana', 'rie', 'kana', 'miho', 'yui'];
const NAME_SUFFIXES = ['_f', '_k', '_n', '_s', '_i', '_t', '.m', '.h', '_o', '_w'];

/** 投稿者の人数（退会済みを除く）。1人あたり平均4〜5件になるようにする。 */
const ACTIVE_AUTHOR_COUNT = 66;
const WITHDRAWN_AUTHOR_COUNT = 2;

function buildUser(rng: Rng, index: number, gender: Gender): User {
  const ageBand = rng.weighted(gender === 'm' ? MALE_AGE_WEIGHTS : FEMALE_AGE_WEIGHTS);
  const names = gender === 'm' ? MALE_NAMES : FEMALE_NAMES;
  const nickname = `${rng.pick(names)}${rng.pick(NAME_SUFFIXES)}${index % 7 === 0 ? String(index) : ''}`;
  const createdAt = SEED_NOW - rng.int(200, 420) * DAY;
  const goalCount = rng.int(1, 3);
  return {
    uid: `seed-user-${String(index).padStart(3, '0')}`,
    nickname,
    email: `seed-user-${String(index).padStart(3, '0')}@example.com`,
    role: 'free',
    termsAgreedAt: createdAt,
    blockedUids: [],
    createdAt,
    updatedAt: createdAt,
    ageBand,
    gender,
    area: rng.weighted(AREA_WEIGHTS),
    exerciseFreq: rng.weighted(EXERCISE_WEIGHTS),
    goals: rng.sample(
      INITIAL_CONCERNS.map((c) => c.id),
      goalCount,
    ),
  };
}

function buildTestUsers(): User[] {
  const createdAt = SEED_NOW - 30 * DAY;
  const base = {
    role: 'free' as const,
    termsAgreedAt: createdAt,
    blockedUids: [],
    createdAt,
    updatedAt: createdAt,
  };
  return [
    {
      ...base,
      uid: TEST_ACCOUNTS.user.uid,
      email: TEST_ACCOUNTS.user.email,
      nickname: 'テストユーザー',
      // モックアップの「あなた」（38歳前後・男性・港区・週2〜3回）に合わせる
      ageBand: '30s',
      gender: 'm',
      area: { prefecture: '13', municipality: '13103' },
      exerciseFreq: 'w2_3',
      goals: ['tone', 'posture', 'golf'],
    },
    {
      ...base,
      uid: TEST_ACCOUNTS.admin.uid,
      email: TEST_ACCOUNTS.admin.email,
      nickname: '運営テスト',
      ageBand: '40s',
      gender: 'x',
      area: null,
      exerciseFreq: 'w1',
      goals: [],
    },
  ];
}

// ---------------------------------------------------------------------------
// 口コミの件数の割り振り
// ---------------------------------------------------------------------------

/** top 層のアイテムに最低限付ける口コミの件数 */
const TOP_MIN_REVIEWS = 10;

/** 層ごとの口コミ件数を決める。合計が SEED_TARGETS.reviews になるよう top で調整する。 */
function allocateReviewCounts(rng: Rng, items: readonly ItemSeed[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.tier === 'low') counts.set(item.id, rng.int(1, 4));
    if (item.tier === 'mid') counts.set(item.id, rng.int(5, 6));
    if (item.tier === 'none') counts.set(item.id, 0);
  }
  const used = [...counts.values()].reduce((a, b) => a + b, 0);
  const tops = items.filter((it) => it.tier === 'top');
  const remaining = SEED_TARGETS.reviews - used;
  // 上位ほど多く付くように重みを付ける。上位で「近い人」の集計が5件以上になるよう、1位に大きく寄せる
  const weights = tops.map((_, i) => 1 / Math.pow(i + 1, 0.8));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  let assigned = 0;
  tops.forEach((item, i) => {
    const n = Math.max(TOP_MIN_REVIEWS, Math.floor((remaining * (weights[i] ?? 0)) / weightSum));
    counts.set(item.id, n);
    assigned += n;
  });
  // 端数は上位から1件ずつ足す（引く）
  let diff = remaining - assigned;
  for (let i = 0; diff !== 0; i = (i + 1) % tops.length) {
    const item = tops[i];
    if (!item) break;
    const current = counts.get(item.id) ?? 0;
    if (diff > 0) {
      counts.set(item.id, current + 1);
      diff -= 1;
    } else if (current > TOP_MIN_REVIEWS) {
      counts.set(item.id, current - 1);
      diff += 1;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// 口コミの本文
// ---------------------------------------------------------------------------

const OPENERS: Readonly<Record<string, readonly string[]>> = {
  shoulder: ['デスクワークで肩と首がいつも重く、', '夕方になると首が張るのが悩みで、'],
  posture: ['姿勢の悪さを指摘されたのがきっかけで、', '猫背を直したくて、'],
  move: ['在宅勤務で運動不足になり、', '階段で息が切れるようになって、'],
  tone: ['体を引き締めたくて、', 'お腹まわりが気になり始めて、'],
  fatigue: ['寝ても疲れが抜けない日が続き、', '週の後半にぐったりするので、'],
  sleep: ['眠りが浅く夜中に目が覚めるので、', '朝すっきり起きられないのが悩みで、'],
  refresh: ['仕事の合間に気分を切り替えたくて、', '週末にしっかりリフレッシュしたくて、'],
  hair: ['頭皮のべたつきと抜け毛が気になり、', '髪のボリュームが減ってきた気がして、'],
  skin: ['清潔感を保ちたくて、', '乾燥で肌がつっぱるのが気になり、'],
  golf: ['ゴルフの飛距離を伸ばしたくて、', 'ラウンド後の疲れを減らしたくて、'],
  run: ['ランニングを続けるために、', 'フルマラソンの完走を目標に、'],
  focus: ['午後の集中力が続かないので、', '会議続きの日でも頭をすっきりさせたくて、'],
  stamina: ['体力の衰えを感じて、', '休日に家族と出かけても疲れないように、'],
  health: ['健康診断の数値が気になり始めて、', '中性脂肪の値を下げたくて、'],
};

const BODIES: Readonly<Record<string, readonly string[]>> = {
  product: [
    '使い始めました。続けやすい価格と手間の少なさが良いです。',
    '試しています。最初は半信半疑でしたが、習慣にしやすいです。',
    '購入しました。説明書が分かりやすく、すぐに使い始められました。',
  ],
  service: [
    '通い始めました。スタッフの説明が丁寧で、予約も取りやすいです。',
    '利用しています。毎回の変化を記録してくれるので続けやすいです。',
    '体験から入りました。雰囲気が落ち着いていて通いやすいです。',
  ],
  pro: [
    'お願いしています。こちらの生活に合わせてメニューを組んでくれます。',
    '担当してもらっています。無理のない目標を一緒に決めてくれました。',
    '指名しています。説明に根拠があって納得しながら続けられます。',
  ],
};

const CLOSINGS: Readonly<Record<number, readonly string[]>> = {
  5: ['はっきり変化を感じていて、これからも続けます。', '期待以上でした。人にも勧めています。'],
  4: [
    '少しずつ効果を感じています。値段がもう少し安ければ満点です。',
    '満足していますが、慣れるまで少し時間がかかりました。',
  ],
  3: [
    '悪くはないですが、劇的な変化はまだありません。',
    '良い点もありますが、自分には合う合わないが分かれそうです。',
  ],
  2: ['期待していたほどの変化はありませんでした。', '続けるのが少し面倒に感じています。'],
  1: ['自分には合いませんでした。', '残念ながら効果を感じられませんでした。'],
};

/** やめた人の締め（「これからも続けます」のように、継続中と食い違う文を避ける） */
const CLOSINGS_STOPPED: Readonly<Record<number, readonly string[]>> = {
  5: [
    'はっきり変化を感じました。目標を達成したので、いまは使っていません。',
    '期待以上でした。人にも勧めています。',
  ],
  4: [
    '効果は感じましたが、値段が気になってやめました。',
    '満足でしたが、いまは別のものを試しています。',
  ],
  2: ['期待していたほどの変化はありませんでした。', '続けるのが面倒になってしまいました。'],
};

function buildText(
  rng: Rng,
  item: ItemSeed,
  goal: string,
  stars: number,
  months: number,
  ongoing: boolean,
): string {
  const opener = rng.pick(OPENERS[goal] ?? ['気になっていたので、']);
  const body = rng.pick(BODIES[item.kind] ?? BODIES.product ?? ['']);
  const closing = rng.pick(
    (!ongoing && CLOSINGS_STOPPED[stars]) || CLOSINGS[stars] || CLOSINGS[3] || [''],
  );
  const period = months >= 12 ? `${Math.floor(months / 12)}年以上` : `${months}ヶ月`;
  const status = ongoing ? `${period}続けています。` : `${period}使ってやめました。`;
  const text = `${opener}${body}${status}${closing}`;
  if (text.length < REVIEW_MIN_TEXT_LENGTH) throw new Error(`本文が短すぎる: ${text}`);
  return text;
}

// ---------------------------------------------------------------------------
// 口コミ
// ---------------------------------------------------------------------------

const STAR_WEIGHTS: readonly (readonly [number, number])[] = [
  [5, 0.42],
  [4, 0.35],
  [3, 0.14],
  [2, 0.06],
  [1, 0.03],
];
const PURCHASE_WEIGHTS: readonly (readonly [PurchaseSource, number])[] = [
  ['amazon', 0.45],
  ['rakuten', 0.25],
  ['official', 0.15],
  ['store', 0.1],
  ['other', 0.05],
];
const DISCOVERY_WEIGHTS: readonly (readonly [DiscoverySource, number])[] = [
  ['referral', 0.35],
  ['search', 0.25],
  ['sns', 0.2],
  ['this_app', 0.15],
  ['other', 0.05],
];

function snapshotOf(user: User): AuthorSnapshot {
  // 参照ではなくコピーで持つ（CLAUDE.md §3-6）
  return {
    ageBand: user.ageBand,
    gender: user.gender,
    area: user.area ? { ...user.area } : null,
    exerciseFreq: user.exerciseFreq,
    nickname: user.nickname,
  };
}

/**
 * 口コミの投稿者を選ぶ。男女比 8:2 を保ちつつ、同じ人が同じアイテムに2回書かないようにする。
 * dense なコホート（30s_m / 40s_m / 50s_m）は自然に多くなる（年代の重みで調整済み）。
 */
function pickAuthor(rng: Rng, authors: readonly User[], used: Set<string>): User {
  const wantMale = rng.chance(SEED_TARGETS.genderRatio.m);
  const pool = authors.filter(
    (a) => (wantMale ? a.gender === 'm' : a.gender === 'f') && !used.has(a.uid),
  );
  const fallback = authors.filter((a) => !used.has(a.uid));
  const chosen = rng.pick(pool.length > 0 ? pool : fallback);
  used.add(chosen.uid);
  return chosen;
}

export function generateSeedData(seed = 20260929): SeedData {
  const rng = createRng(seed);
  const items = buildItems();

  const activeAuthors: User[] = [];
  for (let i = 1; i <= ACTIVE_AUTHOR_COUNT; i++) {
    // 8:2 で性別を割り当てる（端数が出ないよう順番で決める）
    activeAuthors.push(buildUser(rng, i, i % 5 === 0 ? 'f' : 'm'));
  }
  const withdrawnAuthors: User[] = [];
  for (let i = 1; i <= WITHDRAWN_AUTHOR_COUNT; i++) {
    withdrawnAuthors.push(buildUser(rng, 900 + i, 'm'));
  }
  const testUsers = buildTestUsers();
  const testUser = testUsers[0];
  if (!testUser) throw new Error('テストユーザーが作れていない');

  const allAuthors = [...activeAuthors, ...withdrawnAuthors];
  const counts = allocateReviewCounts(rng, items);
  const reviews: Review[] = [];

  // テストユーザーの口コミ（MY WELLNESS の表示確認用）。件数は counts の内数にする
  const testReviewItemIds = new Set(['prd-001', 'svc-002']);

  for (const item of items) {
    const count = counts.get(item.id) ?? 0;
    const usedAuthors = new Set<string>();
    for (let k = 0; k < count; k++) {
      const author =
        k === 0 && testReviewItemIds.has(item.id)
          ? testUser
          : pickAuthor(rng, allAuthors, usedAuthors);
      usedAuthors.add(author.uid);
      const withdrawn = withdrawnAuthors.some((w) => w.uid === author.uid);

      const stars = rng.weighted(STAR_WEIGHTS);
      const months = rng.weighted<number>([
        [rng.int(1, 3), 0.3],
        [rng.int(4, 11), 0.4],
        [rng.int(12, 36), 0.3],
      ]);
      const ongoing = rng.chance(stars >= 4 ? 0.8 : stars === 3 ? 0.45 : 0.15);
      const goal = rng.pick(item.concernIds);
      const extraGoals = item.concernIds.filter((c) => c !== goal);
      const goalTags =
        rng.chance(0.35) && extraGoals.length > 0 ? [goal, rng.pick(extraGoals)] : [goal];
      const createdAt = SEED_NOW - rng.int(1, 365) * DAY - rng.int(0, DAY - 1);
      const snapshot = snapshotOf(author);

      reviews.push({
        id: `${item.id}-r${String(k + 1).padStart(3, '0')}`,
        itemId: item.id,
        uid: withdrawn ? null : author.uid,
        stars,
        goalTags,
        months,
        ongoing,
        purchaseSource: item.kind === 'product' ? rng.weighted(PURCHASE_WEIGHTS) : null,
        discoverySource: item.kind === 'product' ? null : rng.weighted(DISCOVERY_WEIGHTS),
        text: buildText(rng, item, goal, stars, months, ongoing),
        // Storage を用意していないので写真は空。退会済みは TODO-A どおり必ず空
        photos: [],
        authorSnapshot: withdrawn ? { ...snapshot, nickname: WITHDRAWN_NICKNAME } : snapshot,
        postingCategory: 'requested',
        // いいねのドキュメント（ReviewLike）の保存先は未定義のため、件数だけ入れる
        likeCount: rng.int(0, stars >= 4 ? 60 : 15),
        status: 'published',
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // 新しい順に並べておく（書き込み順は結果に影響しないが、dry-run の出力を見やすくする）
  reviews.sort((a, b) => b.createdAt - a.createdAt);

  const favorites = ['prd-006', 'svc-001', 'pro-001'].map((itemId, i) => ({
    uid: testUser.uid,
    itemId,
    createdAt: SEED_NOW - (i + 1) * 3 * DAY,
  }));

  // 口コミを書いていない投稿者は users に入れない（ダミーとして意味がないため）
  const writers = new Set(reviews.map((r) => r.uid));
  const users = [...testUsers, ...activeAuthors.filter((u) => writers.has(u.uid))];

  return {
    concerns: INITIAL_CONCERNS.map((c, i) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      order: i + 1,
    })),
    items,
    users,
    withdrawnAuthorCount: withdrawnAuthors.length,
    reviews,
    favorites,
    columns: buildColumns(),
    notices: buildNotices(),
  };
}

// ---------------------------------------------------------------------------
// コラム・お知らせ（モックアップ rev.3 から）
// ---------------------------------------------------------------------------

function buildColumns(): Column[] {
  return [
    {
      id: 'col-001',
      title: '「疲れが抜けない」の正体は3つに分かれる',
      body: '「疲れが抜けない」と一言で言っても、口コミを読み込むと理由は大きく3つに分かれます。①睡眠の質、②首・肩まわりの循環、③単純な運動不足。同じ悩みでも、どれに当たるかで合うものが変わります。',
      heroStyle: 'navy',
      itemIds: ['prd-006', 'svc-002', 'prd-010'],
      publishedAt: SEED_NOW - 40 * DAY,
    },
    {
      id: 'col-002',
      title: 'ホームサウナを1年半使い続けた話',
      body: '高額なウェルネス機器で本当に知りたいのは、スペックではなく「1年後も使っているか」です。今回は自宅にサウナを導入した3名に、設置・音・掃除・家族の使用状況まで伺いました。',
      heroStyle: 'green',
      itemIds: ['prd-011'],
      publishedAt: SEED_NOW - 25 * DAY,
    },
    {
      id: 'col-003',
      title: '外食が多い人の、続く食べ方5選',
      body: '続かない原因の多くは「意志」ではなく「選択肢の数」です。会食・外食が週の半分を超える人でも選べる組み合わせと、当日の帳尻の合わせ方を5つ挙げました。数値そのものより、続けられる形に落とすことを優先しています。',
      heroStyle: 'slate',
      itemIds: ['prd-004'],
      publishedAt: SEED_NOW - 17 * DAY,
    },
  ];
}

function buildNotices(): Notice[] {
  // モックアップの「口コミ投稿キャンペーン（抽選でプレゼント）」は、
  // Phase 1 でキャンペーン投稿を扱わないため入れていない
  return [
    {
      id: 'ntc-004',
      title: '「悩みから探す」に “健康診断の数値が気になる” を追加しました',
      body: '悩み・目的の選択肢に「健康診断の数値が気になる」を追加しました。',
      publishedAt: Date.UTC(2026, 8, 24),
    },
    {
      id: 'ntc-003',
      title: 'ウェルネスコラム「外食が多い人の、続く食べ方」を公開しました',
      body: 'コラムの一覧からご覧いただけます。',
      publishedAt: Date.UTC(2026, 8, 12),
    },
    {
      id: 'ntc-002',
      title: '「悩みから探す」機能を追加しました',
      body: 'ホームと探すタブから、悩み・目的を選んで比べられるようになりました。',
      publishedAt: Date.UTC(2026, 8, 3),
    },
    {
      id: 'ntc-001',
      title: '口コミに「使用期間」「継続中か」の項目が追加されました',
      body: '投稿時に使用期間と、いまも続けているかを選べるようになりました。',
      publishedAt: Date.UTC(2026, 7, 28),
    },
  ];
}

/** 口コミ投稿者のコホート（検証・集計用） */
export const cohortOf = (review: Review) =>
  cohortKey(review.authorSnapshot.ageBand, review.authorSnapshot.gender);
