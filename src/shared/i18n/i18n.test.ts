import { afterEach, describe, expect, it } from 'vitest'
import { EN } from './en'
import { format, getLanguage, isLanguage, locale, setLanguage, t, translate } from './index'

const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()

afterEach(() => setLanguage('id'))

describe('i18n', () => {
  it('uses the Indonesian source text by default', () => {
    expect(getLanguage()).toBe('id')
    expect(t('Simpan')).toBe('Simpan')
  })

  it('switches to English', () => {
    setLanguage('en')
    expect(t('Simpan')).toBe('Save')
    expect(t('Hapus tema "{name}"?', { name: 'Api' })).toBe('Delete the theme "Api"?')
    expect(locale()).toBe('en-GB')
  })

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(format('{a} dan {b}', { a: 1, b: 'dua' })).toBe('1 dan dua')
    expect(format('{a} {missing}', { a: 'x' })).toBe('x {missing}')
    expect(translate('id', 'Item ke-{n} tidak valid.', { n: 3 })).toBe('Item ke-3 tidak valid.')
  })

  it('has an English text for every key with the same placeholders', () => {
    for (const [key, english] of Object.entries(EN)) {
      expect(english.trim(), key).not.toBe('')
      expect(placeholders(english), key).toEqual(placeholders(key))
    }
  })

  it('translates messages thrown by shared validators', async () => {
    const { validateSongInput } = await import('../songs')
    setLanguage('en')
    expect(() => validateSongInput({ title: '', sections: [] })).toThrow('Song title is required.')
  })

  it('knows only Indonesian and English', () => {
    expect(isLanguage('id')).toBe(true)
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
  })
})
