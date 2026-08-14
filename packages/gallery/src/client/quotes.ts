/**
 * quotes.ts — 凡人修仙传经典语录（吉祥物对话气泡用）。
 *
 * 数据来源：忘语《凡人修仙传》原著中的经典对白/名场面台词，按角色皮肤
 * 归属整理。每款皮肤一组短句，吉祥物随机选取一条冒泡展示。纯文本数据，
 * 无依赖、保持轻量。
 */
export interface SkinQuotes {
  /** 皮肤 id。 */
  skinId: string
  /** 该款皮肤的专属语录（吉祥物随机冒泡）。 */
  lines: string[]
}

/** 凡人修仙传 5 款皮肤的经典语录表（数组顺序即随机池）。 */
export const FANREN_QUOTES: readonly SkinQuotes[] = Object.freeze([
  {
    skinId: 'mupeiling-blossom',
    lines: [
      '韩立，你我同门一场，何必如此刀兵相向……',
      '这桃花落得再美，也不及那人生若只如初见。',
      '我是落云宗药园的女修，只愿守一方清净药田。',
      '你说的修仙长生，在我眼里不及一炉安神丹。',
      '药园四季，春桃秋菊，都各有各的缘分。',
      '莫要急着赶路，且看这山间晨曦可好。',
    ],
  },
  {
    skinId: 'hanli-daoist',
    lines: [
      '贫道行走江湖，向来人不犯我，我不犯人。',
      '青竹蜂云剑出鞘之日，便是了却因果之时。',
      '修仙之路，贵在坚持，切莫贪功冒进。',
      '留得青山在，哪怕没柴烧。',
      '这雷光再烈，也照不亮人心里的贪婪。',
      '天道酬勤，我韩立能走到今日，靠的是一步一个脚印。',
    ],
  },
  {
    skinId: 'yinyue-lunar',
    lines: [
      '月有阴晴圆缺，人有悲欢离合，此事古难全。',
      '我虽是器灵转生，却也想看看这人间烟火。',
      '星光不问赶路人，岁月不负有心人。',
      '月华如水，愿君莫负这良宵。',
      '一轮明月照九州，几家欢乐几家愁。',
      '既是月下之约，便莫要爽约。',
    ],
  },
  {
    skinId: 'nangongwan-moon',
    lines: [
      '掩月宗一事，我自有定夺，你不必为我挂怀。',
      '韩立，若你他年证道，记得回来看我一眼。',
      '冰肌玉骨，也难抵岁月无情。',
      '这世间因果，终究自有公道。',
      '我南宫婉做事，从不后悔。',
      '朱雀赤纹燃起之日，便是血债血偿之时。',
    ],
  },
  {
    skinId: 'ziling-mystic',
    lines: [
      '一面轻纱掩倾城，世人皆道我神秘。',
      '妙音门主之女，只愿随心所欲，快意恩仇。',
      '紫霞流转处，皆是妾身的巧思。',
      '面纱之下真假难辨，你可愿听我一句真言？',
      '这星河璀璨，却不及人间知己情长。',
      '我汪凝虽出身魔道，行事却重情重义。',
    ],
  },
])

/** 按皮肤 id 取语录组（无则回退通用池）。 */
export function quotesForSkin(skinId: string): readonly string[] {
  return FANREN_QUOTES.find(q => q.skinId === skinId)?.lines
    ?? ['慢慢来，比较快。', '路虽远，行则必至。']
}

/** 随机取一条（下标不稳定，每次调用都会变更，保证连续冒泡不重复）。 */
export function randomQuote(skinId: string, avoidLast: string | null): string {
  const pool = quotesForSkin(skinId)
  if (pool.length === 1) return pool[0] ?? ''
  let idx = Math.floor(Math.random() * pool.length)
  let guard = 0
  while (pool[idx] === avoidLast && guard < pool.length) {
    idx = (idx + 1) % pool.length
    guard += 1
  }
  return pool[idx] ?? ''
}
