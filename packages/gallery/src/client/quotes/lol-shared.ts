/**
 * lol-shared.ts — 英雄联盟系列语录的公共黄历词表（各英雄文件拼上自己的
 * 专属词后交给 builder 组合，凑满每语言 200 句）。
 */

/** 中文「宜」公共词（程序员日常 ×）。 */
export const GOOD_ZH_BASE = [
  '推塔上线', '补齐测试', '静心重构', '小步提交', '整理文档',
  '备份存档', '复盘总结', '喝口水', '伸个懒腰', '早睡养神',
]

/** 中文「忌」公共词。 */
export const BAD_ZH_BASE = [
  '裸奔上线', '删库跑路', '跳过测试', '复制粘贴咒', '深夜爆肝',
  '囤积需求', '和人对线', '无备份清田',
]

/** 英文「宜」公共词。 */
export const GOOD_EN_BASE = [
  'pushing the turret', 'writing tests', 'a calm refactor', 'small commits', 'tidying docs',
  'backing everything up', 'a quiet retrospective', 'a glass of water', 'a good stretch', 'an early night',
]

/** 英文「忌」公共词。 */
export const BAD_EN_BASE = [
  'deploying unguarded', 'deleting the repo', 'skipping tests', 'copy-paste spells', 'an all-nighter',
  'hoarding tickets', 'picking fights', 'clearing fields without backup',
]
