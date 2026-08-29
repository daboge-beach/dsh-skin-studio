/**
 * StatsModal — 本地使用统计面板（v0.14）。
 *
 * 从设置抽屉「使用统计」进入：各皮肤使用时长 / 激活次数排行、试穿
 * 转化率、统计起点；数据只在本机（localStorage），提供不可恢复的清除
 * 按钮（红色确认）。文案走 i18n，样式复用详情弹窗模块。
 */
import { useState } from 'react'
import { clearStats, formatDuration, getStats, type UsageStats } from './usageStats.ts'
import { skinRegistry } from './registry/skinRegistry.ts'
import { Modal } from './Modal.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { showToast } from './Toast.tsx'
import { t } from './i18n.ts'
import styles from './SkinDetailModal.module.css'

/** 深拷贝当前统计（面板展示的是打开瞬间的快照）。 */
function cloneStats(): UsageStats {
  return JSON.parse(JSON.stringify(getStats())) as UsageStats
}

export interface StatsModalProps {
  onClose: () => void
}

export function StatsModal({ onClose }: StatsModalProps): JSX.Element {
  const [snapshot, setSnapshot] = useState(() => cloneStats())
  const [confirmClear, setConfirmClear] = useState(false)

  const rows = Object.keys(new Set([...Object.keys(snapshot.seconds), ...Object.keys(snapshot.switches)]) as Set<string>)
    .map(id => ({
      id,
      name: skinRegistry.get(id)?.name ?? id,
      seconds: snapshot.seconds[id] ?? 0,
      switches: snapshot.switches[id] ?? 0,
    }))
    .sort((a, b) => b.seconds - a.seconds || b.switches - a.switches)
    .slice(0, 10)

  const conversion = snapshot.tryOns > 0 ? Math.round((snapshot.applies / snapshot.tryOns) * 100) : null

  return (
    <>
      <Modal onClose={onClose} size="default" labelledBy="stats-title">
        <div className={styles.detail}>
          <div className={styles.meta}>
            <h2 id="stats-title">{t('usageStats')}</h2>
            <p className={styles.author}>
              {t('statsSince')} {new Date(snapshot.firstAt).toLocaleDateString()} · {t('statsLocalOnly')}
            </p>
          </div>

          <section className={styles.tokens}>
            <h3>{t('statsOverview')}</h3>
            <ul>
              <li>{t('tryOns')}：<strong>{snapshot.tryOns}</strong></li>
              <li>{t('applies')}：<strong>{snapshot.applies}</strong>{conversion !== null && <>（{t('conversion')} {conversion}%）</>}</li>
            </ul>
          </section>

          <section className={styles.tokens}>
            <h3>{t('statsPerSkin')}</h3>
            {rows.length === 0 ? (
              <p style={{ fontSize: 12, opacity: 0.7 }}>{t('statsNoData')}</p>
            ) : (
              <div className={styles['tokens-list']}>
                {rows.map(row => (
                  <div key={row.id} className={styles['token-row']}>
                    <code className={styles['token-name']}>{row.name}</code>
                    <code className={styles['token-value']}>
                      {formatDuration(row.seconds)} · {t('switchesShort')} {row.switches}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className={styles.actions}>
            <button
              type="button" className={`${styles.btn} ${styles['btn--ghost']}`}
              style={{ color: '#dc2626' }}
              onClick={() => { setConfirmClear(true) }}
            >
              {t('clearStats')}
            </button>
            <button type="button" className={`${styles.btn} ${styles['btn--primary']}`} onClick={onClose}>
              {t('cancel')}
            </button>
          </footer>
        </div>
      </Modal>

      {confirmClear && (
        <ConfirmDialog
          title={t('clearStats')}
          message={t('clearStatsMsg')}
          danger
          confirmLabel={t('clearStats')}
          onCancel={() => { setConfirmClear(false) }}
          onConfirm={() => {
            clearStats()
            setSnapshot(cloneStats())
            setConfirmClear(false)
            showToast({ message: t('statsCleared'), type: 'success' })
          }}
        />
      )}
    </>
  )
}
