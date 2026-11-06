// The icons below are components made by a small factory, which the fast
// refresh rule cannot recognize.
/* eslint-disable react-refresh/only-export-components */
// Small line icons, drawn inline so the app needs no icon font or network.
type IconProps = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
})

export function MoonIcon({ size = 16 }: IconProps): React.JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

export function SunIcon({ size = 16 }: IconProps): React.JSX.Element {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function GearIcon({ size = 16 }: IconProps): React.JSX.Element {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  )
}

export function CheckIcon({ size = 14 }: IconProps): React.JSX.Element {
  return (
    <svg {...base(size)} strokeWidth={2.6}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

// Builds an icon from one or more path strings.
function icon(paths: string[], defaultSize = 16) {
  return function Icon({ size = defaultSize }: IconProps): React.JSX.Element {
    return (
      <svg {...base(size)}>
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    )
  }
}

export const PlusIcon = icon(['M12 5v14M5 12h14'])
export const FileIcon = icon(['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'])
export const FolderIcon = icon(['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'])
export const SaveIcon = icon(['M5 3h11l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', 'M8 3v5h7V3', 'M8 21v-7h8v7'])
export const ChevronDownIcon = icon(['M6 9l6 6 6-6'])
export const ChevronLeftIcon = icon(['M15 6l-6 6 6 6'])
export const ChevronRightIcon = icon(['M9 6l6 6-6 6'])
export const CopyIcon = icon(['M9 9h10v10H9z', 'M5 15V5h10'])
export const TrashIcon = icon(['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'])
export const EditIcon = icon(['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'])
export const SendIcon = icon(['M5 12h14', 'M13 6l6 6-6 6'])
export const StopIcon = icon(['M6 6h12v12H6z'])
export const KeyboardIcon = icon(['M3 6h18v12H3z', 'M7 10h.01M11 10h.01M15 10h.01M7 14h10'])
export const MusicIcon = icon([
  'M9 18V5l11-2v13',
  'M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  'M20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
])
export const BookIcon = icon(['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z', 'M4 19V5', 'M12 7v6M9 10h6'])
export const ImageIcon = icon(['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6', 'M15 9h.01'])
export const TextIcon = icon(['M5 6h14', 'M12 6v13', 'M9 19h6'])
export const MonitorIcon = icon(['M3 5h18v11H3z', 'M8 20h8M12 16v4'])
export const PaletteIcon = icon([
  'M12 3a9 9 0 0 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5Z',
  'M7.5 11h.01M10 7h.01M15 7.5h.01'
])
