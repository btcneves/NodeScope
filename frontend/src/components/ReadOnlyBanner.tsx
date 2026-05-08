import type { NetworkModeData } from '../types/api'
import { useI18n } from '../i18n'

export function ReadOnlyBanner({ mode }: { mode: NetworkModeData | null }) {
  const { t } = useI18n()
  if (!mode?.read_only) return null

  return (
    <div
      style={{
        width: '100%',
        background: '#451a03',
        borderBottom: '1px solid #92400e',
        color: '#fed7aa',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: '8px 18px',
        boxSizing: 'border-box',
      }}
    >
      <strong style={{ color: '#fdba74' }}>{t.network.readOnlyBanner}</strong>{' '}
      <span style={{ color: '#ffedd5' }}>
        {t.network.modeLabel}: {mode.chain ?? 'unknown'} · {t.network.readOnlyReason}: {mode.reason}
      </span>
    </div>
  )
}
