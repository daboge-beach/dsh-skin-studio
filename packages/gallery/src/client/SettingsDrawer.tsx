/**
 * SettingsDrawer — 皮肤中心设置面板（v0.9 顶部按钮群收拢于此）。
 *
 * 画廊一级操作只留 搜索 / 上传 / 设置入口；全部开关按
 * 外观 / 动效 / 吉祥物 / 提醒 / 高级 分组，危险操作（还原出厂）带确认。
 * 自包含订阅 skinStudioSettings（打开期间实时反映外部变化），
 * 文案全部经 i18n t()（中/英）。
 */
import { useEffect, useState } from 'react'
import type { SkinStudioSettings } from './settings.ts'
import { skinStudioSettings } from './settings.ts'
import { Modal } from './Modal.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { t } from './i18n.ts'
import styles from './SkinDetailModal.module.css'
import panelStyles from './GalleryPanel.module.css'

/** 打开期间保持 settings 快照实时。 */
function useSettingsSnapshot(): SkinStudioSettings {
  const [snapshot, setSnapshot] = useState(() => skinStudioSettings.get())
  useEffect(() => skinStudioSettings.subscribe(setSnapshot), [])
  return snapshot
}

/** 一行设置：名称 + 说明 + 右侧控件。 */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className={styles['token-row']} style={{ alignItems: 'center', padding: '6px 0' }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 13 }}>{label}</strong>
        {hint !== undefined && (
          <span style={{ display: 'block', fontSize: 11, opacity: 0.65, marginTop: 2, lineHeight: 1.4 }}>{hint}</span>
        )}
      </span>
      <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{children}</span>
    </div>
  )
}

/** 开/关双段控件。 */
function Toggle({ value, onChange, ariaLabel }: { value: boolean; onChange: (v: boolean) => void; ariaLabel: string }): JSX.Element {
  return (
    <>
      <button
        type="button" aria-pressed={value} aria-label={`${ariaLabel}: ${t('on')}`}
        className={value ? styles.btn : panelStyles.mascotToggle} style={{ padding: '3px 10px', fontSize: 12 }}
        onClick={() => { onChange(true) }}
      >
        {t('on')}
      </button>
      <button
        type="button" aria-pressed={!value} aria-label={`${ariaLabel}: ${t('off')}`}
        className={!value ? styles.btn : panelStyles.mascotToggle} style={{ padding: '3px 10px', fontSize: 12, ...( !value ? { background: '#dc2626' } : {}) }}
        onClick={() => { onChange(false) }}
      >
        {t('off')}
      </button>
    </>
  )
}

/** 多段循环控件（点击进入下一项）。 */
function Cycle({ options, value, onSelect }: {
  options: Array<{ key: string; label: string }>
  value: string
  onSelect: (key: string) => void
}): JSX.Element {
  return (
    <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {options.map(opt => (
        <button
          key={opt.key} type="button" aria-pressed={value === opt.key}
          className={value === opt.key ? styles.btn : panelStyles.mascotToggle}
          style={{ padding: '3px 10px', fontSize: 12 }}
          onClick={() => { onSelect(opt.key) }}
        >
          {opt.label}
        </button>
      ))}
    </span>
  )
}

export interface SettingsDrawerProps {
  onClose: () => void
  /** 还原出厂（需要 ctx.theme + toast，由宿主面板注入）。 */
  onFactoryReset: () => void
}

export function SettingsDrawer({ onClose, onFactoryReset }: SettingsDrawerProps): JSX.Element {
  const s = useSettingsSnapshot()
  const [confirmReset, setConfirmReset] = useState(false)

  const notifyOptions = [
    { key: 'off', label: t('off') },
    { key: 'sound', label: t('sound') },
    { key: 'motion', label: t('motion') },
    { key: 'both', label: t('both') },
  ]

  return (
    <>
      <Modal onClose={onClose} size="default" labelledBy="settings-title">
        <div className={styles.detail}>
          <div className={styles.meta}>
            <h2 id="settings-title">{t('settingsTitle')}</h2>
          </div>

          <section className={styles.tokens}>
            <h3>{t('groupAppearance')}</h3>
            <Row label={t('bgShow')} hint={t('bgShowHint')}>
              <Toggle ariaLabel={t('bgShow')} value={s.glass} onChange={v => { skinStudioSettings.setGlass(v) }} />
            </Row>
            <Row label={t('cursorToggle')} hint={t('cursorHint')}>
              <Toggle ariaLabel={t('cursorToggle')} value={s.cursorFx} onChange={v => { skinStudioSettings.setCursorFx(v) }} />
            </Row>
            <Row label={t('bgFitCover') + '/' + t('bgFitContain')} hint={t('bgFitHint')}>
              <Cycle
                value={s.bgFit}
                options={[{ key: 'cover', label: t('bgFitCover') }, { key: 'contain', label: t('bgFitContain') }]}
                onSelect={k => { skinStudioSettings.setBgFit(k === 'contain' ? 'contain' : 'cover') }}
              />
            </Row>
          </section>

          <section className={styles.tokens}>
            <h3>{t('groupMotion')}</h3>
            <Row label={t('animationPolicy')} hint={t('animationHint')}>
              <Cycle
                value={s.animations}
                options={[{ key: 'system', label: t('followSystem') }, { key: 'always', label: t('alwaysPlay') }]}
                onSelect={k => { skinStudioSettings.setAnimations(k === 'always' ? 'always' : 'system') }}
              />
            </Row>
          </section>

          <section className={styles.tokens}>
            <h3>{t('groupMascot')}</h3>
            <Row label={t('mascotToggle')} hint={t('mascotHint')}>
              <Toggle ariaLabel={t('mascotToggle')} value={s.mascotEnabled} onChange={v => { skinStudioSettings.setMascotEnabled(v) }} />
            </Row>
            <Row label={t('quoteLang')} hint={t('quoteLangHint')}>
              <Cycle
                value={s.quoteLang}
                options={[{ key: 'zh', label: t('chinese') }, { key: 'en', label: t('english') }]}
                onSelect={k => { skinStudioSettings.setQuoteLang(k === 'en' ? 'en' : 'zh') }}
              />
            </Row>
          </section>

          <section className={styles.tokens}>
            <h3>{t('groupAlerts')}</h3>
            <Row label={t('taskNotify')} hint={t('taskNotifyHint')}>
              <Cycle
                value={s.notifyTaskDone}
                options={notifyOptions}
                onSelect={k => { skinStudioSettings.setNotifyTaskDone(k as 'off' | 'sound' | 'motion' | 'both') }}
              />
            </Row>
          </section>

          <section className={styles.tokens}>
            <h3>{t('groupAdvanced')}</h3>
            <Row label={t('tierSync')} hint={t('tierSyncHint')}>
              <Toggle ariaLabel={t('tierSync')} value={s.tierSyncEffort} onChange={v => { skinStudioSettings.setTierSyncEffort(v) }} />
            </Row>
            <Row label={t('uiLanguage')} hint={t('uiLangHint')}>
              <Cycle
                value={s.uiLang ?? 'auto'}
                options={[{ key: 'auto', label: t('auto') }, { key: 'zh', label: t('chinese') }, { key: 'en', label: t('english') }]}
                onSelect={k => { skinStudioSettings.setUiLang(k === 'auto' ? undefined : k as 'zh' | 'en') }}
              />
            </Row>
            <Row label={t('factoryReset')} hint={t('factoryResetHint')}>
              <button
                type="button" className={panelStyles.factoryReset} style={{ padding: '3px 10px', fontSize: 12 }}
                onClick={() => { setConfirmReset(true) }}
              >
                {t('factoryReset')}
              </button>
            </Row>
          </section>
        </div>
      </Modal>

      {confirmReset && (
        <ConfirmDialog
          title={t('confirmResetTitle')}
          message={t('confirmResetMsg')}
          danger
          confirmLabel={t('factoryReset')}
          onCancel={() => { setConfirmReset(false) }}
          onConfirm={() => { setConfirmReset(false); onClose(); onFactoryReset() }}
        />
      )}
    </>
  )
}
