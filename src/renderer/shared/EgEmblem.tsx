// Shown by the Logo button when no church logo has been chosen yet.
export function EgEmblem(): React.JSX.Element {
  return (
    <svg viewBox="0 0 64 64" width="360" height="360" role="img" aria-label="El-Gibbor">
      <path
        d="M32 3 L57 11 V30 C57 45 46 56 32 61 C18 56 7 45 7 30 V11 Z"
        fill="#1c1917"
        stroke="#D4A017"
        strokeWidth="2.5"
      />
      <text x="32" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="#D4A017">
        EG
      </text>
    </svg>
  )
}
