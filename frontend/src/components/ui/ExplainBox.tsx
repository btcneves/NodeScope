interface Props {
  text: string
  icon?: string
}

export function ExplainBox({ text, icon = '●' }: Props) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e3a5f',
        borderLeft: '3px solid #3b82f6',
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 16,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ color: '#3b82f6', fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, fontFamily: 'monospace' }}>
        {text}
      </span>
    </div>
  )
}
