import { useI18n } from '../../i18n'

interface Props {
  children: React.ReactNode
  title?: string
}

export function LearnMore({ children, title }: Props) {
  const { t } = useI18n()
  const label = title ?? t.learn.whyMatters

  return (
    <details style={{
      background: '#0f172a',
      border: '1px solid #1e3a5f',
      borderRadius: 6,
      padding: '8px 14px',
      marginTop: 12,
      fontFamily: 'monospace',
    }}>
      <summary style={{
        cursor: 'pointer',
        fontSize: 11,
        color: '#60a5fa',
        fontWeight: 600,
        letterSpacing: '0.04em',
        userSelect: 'none',
        outline: 'none',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>▶</span>
        {label}
      </summary>
      <div style={{
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 1.7,
        paddingTop: 10,
        borderTop: '1px solid #1e3a5f',
        marginTop: 8,
      }}>
        {children}
      </div>
    </details>
  )
}
