// The 66 books of the Protestant canon, in order. Names follow the Indonesian
// Terjemahan Baru (TB); aliases cover common Indonesian and English spellings
// so operators can type "yoh", "john", "1kor", or "1 cor".

export interface BibleBook {
  // 1 = Genesis … 66 = Revelation (Zefania bnumber order).
  id: number
  name: string
  abbreviation: string
  osis: string
  english: string
  aliases: readonly string[]
}

type Row = [name: string, abbreviation: string, osis: string, english: string, aliases?: string]

const ROWS: readonly Row[] = [
  ['Kejadian', 'Kej', 'Gen', 'Genesis', 'kj gn ge'],
  ['Keluaran', 'Kel', 'Exod', 'Exodus', 'kl ex exo'],
  ['Imamat', 'Im', 'Lev', 'Leviticus', 'imt lv'],
  ['Bilangan', 'Bil', 'Num', 'Numbers', 'bl nm nu'],
  ['Ulangan', 'Ul', 'Deut', 'Deuteronomy', 'ulg dt'],
  ['Yosua', 'Yos', 'Josh', 'Joshua', 'jos'],
  ['Hakim-hakim', 'Hak', 'Judg', 'Judges', 'hakim jdg'],
  ['Rut', 'Rut', 'Ruth', 'Ruth', 'rt'],
  ['1 Samuel', '1Sam', '1Sam', '1 Samuel', '1sm 1sa'],
  ['2 Samuel', '2Sam', '2Sam', '2 Samuel', '2sm 2sa'],
  ['1 Raja-raja', '1Raj', '1Kgs', '1 Kings', '1raja 1rj 1ki 1kg'],
  ['2 Raja-raja', '2Raj', '2Kgs', '2 Kings', '2raja 2rj 2ki 2kg'],
  ['1 Tawarikh', '1Taw', '1Chr', '1 Chronicles', '1tw 1ch'],
  ['2 Tawarikh', '2Taw', '2Chr', '2 Chronicles', '2tw 2ch'],
  ['Ezra', 'Ezr', 'Ezra', 'Ezra'],
  ['Nehemia', 'Neh', 'Neh', 'Nehemiah'],
  ['Ester', 'Est', 'Esth', 'Esther'],
  ['Ayub', 'Ayb', 'Job', 'Job', 'ay'],
  ['Mazmur', 'Mzm', 'Ps', 'Psalms', 'mz maz psalm psa'],
  ['Amsal', 'Ams', 'Prov', 'Proverbs', 'prv pr'],
  ['Pengkhotbah', 'Pkh', 'Eccl', 'Ecclesiastes', 'pengkotbah ecc'],
  ['Kidung Agung', 'Kid', 'Song', 'Song of Songs', 'kidung kdg songofsolomon sos'],
  ['Yesaya', 'Yes', 'Isa', 'Isaiah', 'ys'],
  ['Yeremia', 'Yer', 'Jer', 'Jeremiah'],
  ['Ratapan', 'Rat', 'Lam', 'Lamentations', 'rtp'],
  ['Yehezkiel', 'Yeh', 'Ezek', 'Ezekiel', 'yehz eze'],
  ['Daniel', 'Dan', 'Dan', 'Daniel', 'dn'],
  ['Hosea', 'Hos', 'Hos', 'Hosea'],
  ['Yoel', 'Yl', 'Joel', 'Joel', 'yoe'],
  ['Amos', 'Am', 'Amos', 'Amos', 'amo'],
  ['Obaja', 'Ob', 'Obad', 'Obadiah', 'oba'],
  ['Yunus', 'Yun', 'Jonah', 'Jonah', 'jon'],
  ['Mikha', 'Mi', 'Mic', 'Micah', 'mik'],
  ['Nahum', 'Nah', 'Nah', 'Nahum'],
  ['Habakuk', 'Hab', 'Hab', 'Habakkuk'],
  ['Zefanya', 'Zef', 'Zeph', 'Zephaniah', 'zep'],
  ['Hagai', 'Hag', 'Hag', 'Haggai'],
  ['Zakharia', 'Za', 'Zech', 'Zechariah', 'zak zec'],
  ['Maleakhi', 'Mal', 'Mal', 'Malachi'],
  ['Matius', 'Mat', 'Matt', 'Matthew', 'mt'],
  ['Markus', 'Mrk', 'Mark', 'Mark', 'mr mk mar'],
  ['Lukas', 'Luk', 'Luke', 'Luke', 'lk'],
  ['Yohanes', 'Yoh', 'John', 'John', 'yh jn jhn'],
  ['Kisah Para Rasul', 'Kis', 'Acts', 'Acts', 'kisah kpr act'],
  ['Roma', 'Rm', 'Rom', 'Romans', 'rom'],
  ['1 Korintus', '1Kor', '1Cor', '1 Corinthians', '1ko'],
  ['2 Korintus', '2Kor', '2Cor', '2 Corinthians', '2ko'],
  ['Galatia', 'Gal', 'Gal', 'Galatians', 'gl'],
  ['Efesus', 'Ef', 'Eph', 'Ephesians', 'efs'],
  ['Filipi', 'Flp', 'Phil', 'Philippians', 'fil php'],
  ['Kolose', 'Kol', 'Col', 'Colossians'],
  ['1 Tesalonika', '1Tes', '1Thess', '1 Thessalonians', '1ts 1th'],
  ['2 Tesalonika', '2Tes', '2Thess', '2 Thessalonians', '2ts 2th'],
  ['1 Timotius', '1Tim', '1Tim', '1 Timothy', '1tm'],
  ['2 Timotius', '2Tim', '2Tim', '2 Timothy', '2tm'],
  ['Titus', 'Tit', 'Titus', 'Titus'],
  ['Filemon', 'Flm', 'Phlm', 'Philemon', 'phm'],
  ['Ibrani', 'Ibr', 'Heb', 'Hebrews'],
  ['Yakobus', 'Yak', 'Jas', 'James', 'jam'],
  ['1 Petrus', '1Ptr', '1Pet', '1 Peter', '1pt 1pe'],
  ['2 Petrus', '2Ptr', '2Pet', '2 Peter', '2pt 2pe'],
  ['1 Yohanes', '1Yoh', '1John', '1 John', '1yh 1jn'],
  ['2 Yohanes', '2Yoh', '2John', '2 John', '2yh 2jn'],
  ['3 Yohanes', '3Yoh', '3John', '3 John', '3yh 3jn'],
  ['Yudas', 'Yud', 'Jude', 'Jude', 'jud'],
  ['Wahyu', 'Why', 'Rev', 'Revelation', 'wah wh rv revelations']
]

export const BIBLE_BOOKS: readonly BibleBook[] = ROWS.map(([name, abbreviation, osis, english, aliases], index) => ({
  id: index + 1,
  name,
  abbreviation,
  osis,
  english,
  aliases: aliases ? aliases.split(' ') : []
}))

// "1 Korintus" → "1korintus", "Hakim-hakim" → "hakimhakim".
export function bookKey(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const EXACT = new Map<string, BibleBook>()
for (const book of BIBLE_BOOKS) {
  for (const key of [book.name, book.abbreviation, book.osis, book.english, ...book.aliases].map(bookKey)) {
    if (!EXACT.has(key)) EXACT.set(key, book)
  }
}

export function bookById(id: number): BibleBook | undefined {
  return BIBLE_BOOKS[id - 1]
}

export function bookByOsis(code: string): BibleBook | undefined {
  const key = bookKey(code)
  return BIBLE_BOOKS.find((book) => bookKey(book.osis) === key)
}

// Finds books for what the operator typed: an exact name or abbreviation
// first, otherwise every book whose Indonesian or English name starts with it.
export function findBooks(text: string): BibleBook[] {
  const key = bookKey(text)
  if (!key) return []
  const exact = EXACT.get(key)
  if (exact) return [exact]
  return BIBLE_BOOKS.filter((book) => bookKey(book.name).startsWith(key) || bookKey(book.english).startsWith(key))
}
