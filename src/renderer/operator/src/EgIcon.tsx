import { t } from '@shared/i18n'
// "EG" monogram inside a shield (design B, "Emas Perisai"). It is the app's
// identity, so it stays gold even when the operator picks another primary color.
const GOLD = '#D4A017'

export function EgIcon({ size = 64 }: { size?: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={t('El-Gibbor Worship')}>
      <path
        d="M32 3 L57 11 V30 C57 45 46 56 32 61 C18 56 7 45 7 30 V11 Z"
        fill="#1c1917"
        stroke={GOLD}
        strokeWidth="3"
      />
      <text x="32" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill={GOLD}>
        EG
      </text>
    </svg>
  )
}
