import { useI18n } from '../i18n'

const GITHUB_OWNER = 'https://github.com/btcneves'
const REPO = 'https://github.com/btcneves/NodeScope'
const CONTACT = 'mailto:neves.dev.br@gmail.com'

export function Footer() {
  const { t } = useI18n()
  const f = t.footer

  const links: { label: string; href: string; external?: boolean }[] = [
    { label: f.github, href: GITHUB_OWNER, external: true },
    { label: f.repository, href: REPO, external: true },
    { label: f.docs, href: 'https://github.com/btcneves/NodeScope/tree/main/docs', external: true },
    { label: f.projectStatus, href: 'https://github.com/btcneves/NodeScope/blob/main/PROJECT_STATUS.md', external: true },
    { label: f.roadmap, href: 'https://github.com/btcneves/NodeScope/blob/main/ROADMAP.md', external: true },
    { label: f.security, href: 'https://github.com/btcneves/NodeScope/blob/main/SECURITY.md', external: true },
    { label: f.license, href: 'https://github.com/btcneves/NodeScope/blob/main/LICENSE', external: true },
    { label: f.contact, href: CONTACT },
  ]

  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <p style={styles.tagline}>{f.tagline}</p>
        <nav style={styles.links} aria-label="Footer navigation">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={styles.link}
              {...(link.external
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p style={styles.copyright}>{f.copyright}</p>
        <p style={styles.disclaimer}>{f.disclaimer}</p>
      </div>
    </footer>
  )
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    borderTop: '1px solid var(--border)',
    marginTop: '48px',
    padding: '24px 16px 20px',
    color: 'var(--muted)',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  inner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tagline: {
    color: 'var(--text)',
    fontSize: '13px',
  },
  links: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 16px',
  },
  link: {
    color: 'var(--muted)',
    textDecoration: 'none',
  },
  copyright: {
    marginTop: '4px',
  },
  disclaimer: {
    fontSize: '11px',
    opacity: 0.7,
  },
}
