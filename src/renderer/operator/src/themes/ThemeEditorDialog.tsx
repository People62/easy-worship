import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@shared/ipc'
import type { Background, Slide, SlideStyle } from '@shared/live'
import {
  FONT_CHOICES,
  LIMITS,
  themeKindLabel,
  THEME_KINDS,
  type Theme,
  type ThemeInput,
  type ThemeKind
} from '@shared/theme'
import { SlideRenderer } from '../../../shared/SlideRenderer'
import { errorMessage } from '../errors'
import { t } from '@shared/i18n'

interface ThemeEditorDialogProps {
  // An existing theme to edit, or the starting point for a new one.
  initial: ThemeInput & { id?: number }
  media: MediaItem[]
  onSaved: (theme: Theme) => void
  onClose: () => void
}

const SAMPLES: Record<ThemeKind, Slide> = {
  song: { id: 'sample', text: 'Bapa Engkau sungguh baik\nKasih-Mu melimpah di hidupku' },
  bible: {
    id: 'sample',
    text: 'Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal.',
    caption: 'Yohanes 3:16'
  },
  text: { id: 'sample', text: 'Selamat datang\nIbadah Raya Minggu' }
}

function NumberField(props: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}): React.JSX.Element {
  return (
    <label className="field range-field">
      <span>
        {props.label}: <strong>{props.suffix === '%' ? Math.round(props.value * 100) : props.value}</strong>
        {props.suffix}
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function ThemeEditorDialog({ initial, media, onSaved, onClose }: ThemeEditorDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(initial.name)
  const [kind, setKind] = useState<ThemeKind>(initial.kind)
  const [style, setStyle] = useState<SlideStyle>(initial.style)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const set = <K extends keyof SlideStyle>(key: K, value: SlideStyle[K]): void =>
    setStyle((s) => ({ ...s, [key]: value }))

  const setBackground = (value: string): void => {
    if (value === 'color') return set('background', { kind: 'color', color: '#000000' })
    const item = media.find((m) => m.id === Number(value))
    if (!item) return
    const background: Background =
      item.kind === 'image'
        ? { kind: 'image', mediaId: item.id, url: item.url }
        : { kind: 'video', mediaId: item.id, url: item.url, posterUrl: item.thumbnailUrl }
    set('background', background)
  }

  const save = async (): Promise<void> => {
    const input: ThemeInput = { name, kind, style }
    try {
      onSaved(initial.id ? await window.api.themes.update(initial.id, input) : await window.api.themes.create(input))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const fontKnown = FONT_CHOICES.some((f) => f.value === style.fontFamily)

  return (
    <dialog ref={dialogRef} className="dialog dialog-wide" onClose={onClose} aria-labelledby="theme-editor-title">
      <header className="dialog-head">
        <h2 id="theme-editor-title">{initial.id ? t('Ubah tema') : t('Tema baru')}</h2>
        <div className="row">
          <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
            {t('Batal')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void save()}>
            {t('Simpan')}
          </button>
        </div>
      </header>

      <div className="dialog-body theme-editor">
        <div className="theme-preview">
          <div className="slide-frame">
            <SlideRenderer slide={{ ...SAMPLES[kind], style }} style={style} overlay="none" logoUrl={null} playVideo />
          </div>
          <p className="hint">{t('Pratinjau. Di TV tampil sama persis.')}</p>
        </div>

        <div className="theme-fields">
          <label className="field field-wide">
            <span>{t('Nama tema *')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
          </label>
          <label className="field">
            <span>{t('Dipakai untuk')}</span>
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as ThemeKind)}>
              {THEME_KINDS.map((k) => (
                <option key={k} value={k}>
                  {themeKindLabel(k)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('Font')}</span>
            <select className="select" value={style.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
              {!fontKnown && <option value={style.fontFamily}>{style.fontFamily}</option>}
              {FONT_CHOICES.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <NumberField
            label={t('Ukuran huruf')}
            value={style.fontSize}
            min={LIMITS.fontSize.min}
            max={LIMITS.fontSize.max}
            suffix=" px"
            onChange={(v) => set('fontSize', v)}
          />
          <NumberField
            label={t('Jarak baris')}
            value={style.lineHeight}
            min={LIMITS.lineHeight.min}
            max={LIMITS.lineHeight.max}
            step={0.05}
            onChange={(v) => set('lineHeight', v)}
          />

          <label className="field">
            <span>{t('Warna teks')}</span>
            <input type="color" value={style.color.toLowerCase()} onChange={(e) => set('color', e.target.value)} />
          </label>
          <div className="field">
            <span>{t('Perataan')}</span>
            <div className="segmented" role="radiogroup" aria-label={t('Perataan')}>
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  role="radio"
                  aria-checked={style.align === align}
                  className={style.align === align ? 'btn btn-active' : 'btn'}
                  onClick={() => set('align', align)}
                >
                  {align === 'left' ? t('Kiri') : align === 'center' ? t('Tengah') : t('Kanan')}
                </button>
              ))}
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" checked={style.uppercase} onChange={(e) => set('uppercase', e.target.checked)} />
            <span>
              <strong>{t('Huruf kapital semua')}</strong>
            </span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={style.shadow} onChange={(e) => set('shadow', e.target.checked)} />
            <span>
              <strong>{t('Bayangan teks')}</strong>
            </span>
          </label>

          <NumberField
            label={t('Garis tepi teks')}
            value={style.outlineWidth}
            min={LIMITS.outlineWidth.min}
            max={LIMITS.outlineWidth.max}
            suffix=" px"
            onChange={(v) => set('outlineWidth', v)}
          />
          <label className="field">
            <span>{t('Warna garis tepi')}</span>
            <input
              type="color"
              value={style.outlineColor.toLowerCase()}
              disabled={style.outlineWidth === 0}
              onChange={(e) => set('outlineColor', e.target.value)}
            />
          </label>

          <NumberField
            label={t('Margin')}
            value={style.margin}
            min={LIMITS.margin.min}
            max={LIMITS.margin.max}
            suffix=" px"
            onChange={(v) => set('margin', v)}
          />

          <label className="field field-wide">
            <span>{t('Latar')}</span>
            <select
              className="select"
              value={style.background.kind === 'color' ? 'color' : String(style.background.mediaId)}
              onChange={(e) => setBackground(e.target.value)}
            >
              <option value="color">{t('Warna polos')}</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.kind === 'video' ? t('Video') : t('Gambar')}: {m.name}
                </option>
              ))}
            </select>
          </label>
          {style.background.kind === 'color' ? (
            <label className="field">
              <span>{t('Warna latar')}</span>
              <input
                type="color"
                value={style.background.color.toLowerCase()}
                onChange={(e) => set('background', { kind: 'color', color: e.target.value })}
              />
            </label>
          ) : (
            <NumberField
              label={t('Gelapkan latar')}
              value={style.backgroundDim}
              min={LIMITS.backgroundDim.min}
              max={LIMITS.backgroundDim.max}
              step={0.05}
              suffix="%"
              onChange={(v) => set('backgroundDim', v)}
            />
          )}
          {media.length === 0 && (
            <p className="hint field-wide">{t('Untuk latar gambar atau video, impor dulu di tab Media.')}</p>
          )}
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  )
}
