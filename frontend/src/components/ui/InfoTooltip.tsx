import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../i18n'
import { getGlossaryEntry } from '../../i18n/glossary'

interface Props {
  term?: string
  text?: string
  size?: number
}

interface TooltipCoords {
  top?: number
  bottom?: number
  left: number
}

export function InfoTooltip({ term, text, size = 13 }: Props) {
  const { lang } = useI18n()
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<TooltipCoords>({ left: 0 })
  const ref = useRef<HTMLSpanElement>(null)

  const tip = text ?? (term ? getGlossaryEntry(term, lang) : undefined)
  if (!tip) return null

  const show = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const tooltipHeight = 80
      const willOverflow = rect.bottom + tooltipHeight + 8 > window.innerHeight
      setCoords({
        left: rect.left + rect.width / 2,
        top: willOverflow ? undefined : rect.bottom + 6,
        bottom: willOverflow ? window.innerHeight - rect.top + 6 : undefined,
      })
    }
    setVisible(true)
  }
  const hide = () => setVisible(false)

  const tooltip = visible ? createPortal(
    <span style={{
      position: 'fixed',
      top: coords.top,
      bottom: coords.bottom,
      left: coords.left,
      transform: 'translateX(-50%)',
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 11,
      fontFamily: 'monospace',
      maxWidth: 260,
      minWidth: 140,
      zIndex: 99999,
      pointerEvents: 'none',
      lineHeight: 1.5,
      whiteSpace: 'normal',
      boxShadow: '0 4px 16px #00000066',
    }}>
      {tip}
    </span>,
    document.body
  ) : null

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      aria-label={tip}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help', outline: 'none' }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#1e3a5f',
        color: '#60a5fa',
        fontSize: size * 0.7,
        fontWeight: 700,
        border: '1px solid #3b82f6',
        lineHeight: 1,
        flexShrink: 0,
        fontFamily: 'monospace',
        userSelect: 'none',
      }}>
        i
      </span>
      {tooltip}
    </span>
  )
}

interface TermProps {
  children: React.ReactNode
  term?: string
  text?: string
}

export function Term({ children, term, text }: TermProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {children}
      <InfoTooltip term={term} text={text} />
    </span>
  )
}
