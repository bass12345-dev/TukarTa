/**
 * chordParser.ts
 * Parses raw web guitar tabs (Chords-over-Lyrics), ChordPro (.cho/.chopro/.crd),
 * and plain text files into TukarTa's interactive ChordPro format (`[Chord]lyric`),
 * plus real-time key transposition for Stage Mode.
 */

export interface ParsedChordSheet {
  title: string;
  artist: string;
  key: string;
  bpm?: number;
  capo?: number;
  genre?: string;
  chordProText: string;
  detectedChords: string[];
}

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
};

// Matches individual chord tokens like C, Am, F#m7, Bbmaj7, Dsus4, G/B, Cadd9, E7#9
const CHORD_TOKEN_REGEX =
  /^[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|M)?(?:\d{0,2})(?:(?:sus|add|maj|min|dim|aug|#|\+|b)\d{0,2})*(?:\/[A-G][b#]?)?$/;

/**
 * Checks if a single word/token is a valid musical chord.
 */
export function isChordToken(token: string): boolean {
  const clean = token.trim().replace(/^[([|]+|[)\]|]+$/g, '');
  if (!clean || clean.length > 11) return false;
  return CHORD_TOKEN_REGEX.test(clean);
}

/**
 * Checks if an entire line from a web guitar tab is a "chord line"
 * (e.g. "G        D          Em         C")
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Section headers like [Chorus] or [Verse 1] are not chord lines
  if (/^\[(?:verse|chorus|bridge|intro|outro|pre-chorus|interlude|solo|instrumental|hook|refrain|coda)/i.test(trimmed)) {
    return false;
  }

  // Strip bar lines and repeat markers
  const cleaned = trimmed.replace(/[|¦:]/g, ' ').trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  // Allow multipliers like x2, x4, (x2)
  const validTokens = tokens.filter((t) => isChordToken(t) || /^[(]?x\d+[)]?$/i.test(t));
  return validTokens.length / tokens.length >= 0.75;
}

/**
 * Merges a line of chords positioned above a line of lyrics into inline ChordPro format:
 *   "G              D"
 *   "Today is gonna be the day"
 * -> "[G]Today is gonna [D]be the day"
 */
export function mergeChordAndLyricLines(chordLine: string, lyricLine: string): string {
  const chordMatches: Array<{ chord: string; index: number }> = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(chordLine)) !== null) {
    const raw = match[0].replace(/^[([|]+|[)\]|]+$/g, '');
    if (isChordToken(raw)) {
      chordMatches.push({ chord: raw, index: match.index });
    }
  }

  if (chordMatches.length === 0) return lyricLine;

  const paddedLyric = lyricLine.padEnd(
    Math.max(lyricLine.length, chordMatches[chordMatches.length - 1].index + 1),
    ' '
  );

  let result = '';
  let lastPos = 0;

  for (const { chord, index } of chordMatches) {
    const pos = Math.min(index, paddedLyric.length);
    result += paddedLyric.slice(lastPos, pos) + `[${chord}]`;
    lastPos = pos;
  }
  result += paddedLyric.slice(lastPos);

  return result.trimEnd();
}

/**
 * Parses raw text (Ultimate Guitar copy-paste, OPM tabs, ChordPro .cho/.crd, or plain lyrics)
 * into structured metadata + normalized ChordPro format.
 */
export function parseRawChordText(
  rawInput: string,
  fallbackTitle = '',
  fallbackArtist = ''
): ParsedChordSheet {
  const lines = rawInput.replace(/\r\n/g, '\n').split('\n');

  let title = fallbackTitle.trim();
  let artist = fallbackArtist.trim();
  let key = '';
  let bpm: number | undefined;
  let capo: number | undefined;
  const detectedChordsSet = new Set<string>();

  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Parse ChordPro directives: {title: ...}, {artist: ...}, {key: ...}, {tempo: ...}, {capo: ...}
    const directiveMatch = trimmed.match(/^\{(\w+):\s*(.+)\}$/i);
    if (directiveMatch) {
      const tag = directiveMatch[1].toLowerCase();
      const val = directiveMatch[2].trim();
      if (tag === 'title' || tag === 't') title = title || val;
      else if (tag === 'artist' || tag === 'subtitle' || tag === 'st' || tag === 'a') artist = artist || val;
      else if (tag === 'key' || tag === 'k') key = key || val;
      else if (tag === 'tempo' || tag === 'bpm') bpm = parseInt(val, 10) || bpm;
      else if (tag === 'capo') capo = parseInt(val, 10) || capo;
      else if (tag === 'c' || tag === 'comment') outputLines.push(`[${val}]`);
      continue;
    }

    // 2. Parse common header metadata lines (e.g. "Title: ...", "Artist: ...", "Key: G", "Capo: 2nd fret", "BPM: 120")
    if (i < 12) {
      const metaMatch = trimmed.match(/^(title|song|artist|band|key|tuning|capo|tempo|bpm)\s*:\s*(.+)$/i);
      if (metaMatch) {
        const label = metaMatch[1].toLowerCase();
        const value = metaMatch[2].trim();
        if ((label === 'title' || label === 'song') && !title) title = value;
        else if ((label === 'artist' || label === 'band') && !artist) artist = value;
        else if (label === 'key' && !key) key = value.split(/\s+/)[0];
        else if (label === 'capo') {
          const num = parseInt(value, 10);
          if (!isNaN(num)) capo = num;
        } else if (label === 'tempo' || label === 'bpm') {
          const num = parseInt(value, 10);
          if (!isNaN(num)) bpm = num;
        }
        continue;
      }

      // Detect "Song Title - Artist Name" or "Song Title by Artist Name" on line 0
      if (i === 0 && !title && !artist && !isChordLine(trimmed) && !trimmed.startsWith('[')) {
        const byMatch = trimmed.match(/^(.+?)\s+by\s+(.+?)(?:\s+chords|\s+tab)?$/i);
        const dashMatch = trimmed.match(/^(.+?)\s+[-–—]\s+(.+?)(?:\s+chords|\s+tab)?$/i);
        if (byMatch) {
          title = byMatch[1].trim();
          artist = byMatch[2].trim();
          continue;
        } else if (dashMatch) {
          title = dashMatch[1].trim();
          artist = dashMatch[2].trim();
          continue;
        }
      }
    }

    // 3. Detect inline ChordPro chords already in brackets (e.g. "[G]Today is [D]gonna")
    const inlineBracketChords = trimmed.match(/\[([A-G][b#]?[^\]]{0,9})\]/g);
    if (inlineBracketChords) {
      inlineBracketChords.forEach((b) => {
        const token = b.slice(1, -1).trim();
        if (isChordToken(token)) detectedChordsSet.add(token);
      });
    }

    // 4. Detect Chords-over-Lyrics two-line format
    if (isChordLine(rawLine)) {
      // Collect all chords on this line
      rawLine
        .trim()
        .split(/\s+/)
        .forEach((t) => {
          const clean = t.replace(/^[([|]+|[)\]|]+$/g, '');
          if (isChordToken(clean)) detectedChordsSet.add(clean);
        });

      const nextLine = lines[i + 1];
      if (
        nextLine !== undefined &&
        nextLine.trim().length > 0 &&
        !isChordLine(nextLine) &&
        !nextLine.trim().startsWith('[') &&
        !nextLine.trim().startsWith('{')
      ) {
        outputLines.push(mergeChordAndLyricLines(rawLine, nextLine));
        i++; // Skip the lyric line since we merged it
      } else {
        // Standalone instrumental chord line (e.g. Intro: G D Em C)
        const chordLineFormatted = rawLine
          .trim()
          .split(/\s+/)
          .map((t) => {
            const clean = t.replace(/^[([|]+|[)\]|]+$/g, '');
            return isChordToken(clean) ? `[${clean}]` : t;
          })
          .join('  ');
        outputLines.push(chordLineFormatted);
      }
      continue;
    }

    outputLines.push(rawLine);
  }

  const detectedChords = Array.from(detectedChordsSet);
  if (!key && detectedChords.length > 0) {
    // Infer key from first chord
    key = detectedChords[0];
  }

  return {
    title: title || 'Untitled Song',
    artist: artist || 'Unknown Artist',
    key: key || 'C',
    bpm,
    capo,
    chordProText: outputLines.join('\n').trim(),
    detectedChords,
  };
}

/**
 * Transposes a single chord token by `semitones` (e.g. +2: G -> A, Em -> F#m, G/B -> A/C#).
 */
export function transposeChord(chord: string, semitones: number): string {
  if (!semitones || semitones % 12 === 0) return chord;

  return chord.replace(/([A-G][b#]?)/g, (note) => {
    const normalized = FLAT_TO_SHARP[note] || note;
    const idx = NOTES_SHARP.indexOf(normalized);
    if (idx === -1) return note;
    const nextIdx = (idx + (semitones % 12) + 12) % 12;
    return NOTES_SHARP[nextIdx];
  });
}

/**
 * Transposes all `[Chord]` tags inside a ChordPro text by `semitones`.
 */
export function transposeChordProText(text: string, semitones: number): string {
  if (!semitones || semitones % 12 === 0) return text;
  return text.replace(/\[([^\]]+)\]/g, (full, inner) => {
    if (isChordToken(inner.trim())) {
      return `[${transposeChord(inner.trim(), semitones)}]`;
    }
    return full;
  });
}

/**
 * Splits a single line containing `[Chord]Lyric` segments into structured segments for Stage Mode rendering.
 */
export interface ChordLyricSegment {
  chord?: string;
  lyric: string;
}

export function parseLineSegments(line: string): {
  isSectionHeader: boolean;
  sectionTitle?: string;
  segments: ChordLyricSegment[];
} {
  const trimmed = line.trim();
  const sectionMatch = trimmed.match(
    /^\[((?:verse|chorus|bridge|intro|outro|pre-chorus|interlude|solo|instrumental|hook|refrain|coda)[^\]]*)\]$/i
  );
  if (sectionMatch) {
    return {
      isSectionHeader: true,
      sectionTitle: sectionMatch[1].toUpperCase(),
      segments: [],
    };
  }

  // Also check plain text section headers like "Chorus:" or "Verse 1:"
  const plainSectionMatch = trimmed.match(
    /^((?:verse|chorus|bridge|intro|outro|pre-chorus|interlude|solo|instrumental)\s*\d*)\s*:?$/i
  );
  if (plainSectionMatch) {
    return {
      isSectionHeader: true,
      sectionTitle: plainSectionMatch[1].toUpperCase(),
      segments: [],
    };
  }

  const segments: ChordLyricSegment[] = [];
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  // Check if there is text before the first bracket
  const firstBracket = line.indexOf('[');
  if (firstBracket === -1) {
    return {
      isSectionHeader: false,
      segments: [{ lyric: line }],
    };
  }
  if (firstBracket > 0) {
    segments.push({ lyric: line.slice(0, firstBracket) });
  }

  while ((match = regex.exec(line)) !== null) {
    const inner = match[1].trim();
    const followingText = match[2] || '';
    if (isChordToken(inner)) {
      segments.push({ chord: inner, lyric: followingText });
    } else {
      segments.push({ lyric: `[${inner}]${followingText}` });
    }
    lastIdx = regex.lastIndex;
  }

  if (segments.length === 0) {
    segments.push({ lyric: line });
  }

  return {
    isSectionHeader: false,
    segments,
  };
}
