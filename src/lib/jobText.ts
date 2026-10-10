/**
 * Job description text: admins paste a full JD (from Indeed, LinkedIn, Word, a PDF...) into one box.
 * This turns that plain text into headings, paragraphs and bullet lists for the job page, the
 * Google Jobs data and the copy-to-LinkedIn text, without the admin having to format anything.
 *
 * Older jobs (descriptionFormat missing / 'points') stored one bullet per line; they keep rendering that way.
 */
import type { Job } from '@/types';

export type JobTextBlock =
  | { type: 'heading'; text: string; sub?: boolean }
  | { type: 'para'; text: string }
  | { type: 'list'; ordered: boolean; items: string[]; start?: number };

// •, ●, ▪, ◦, ‣, ∙, ·, -, *, –, —, ➢, ►, ▶, ➤, ✓, ✔, ❖, ■, □, and Word/PDF symbol-font bullets.
const BULLET = /^\s*(?:[•●▪◦‣∙·*\-–—➢►▶➤✓✔❖■□○])\s*/;
// "1. Text", "2) Text", "a) Text", and "7.Testing" (no space) from careless pastes.
const NUMBERED = /^\s*(?:\d{1,2}[.)](?:\s+|(?=[A-Za-z]))|[a-hA-H][.)]\s+)/;
// Word soft breaks, Unicode line/paragraph separators and old Mac line endings all count as new lines.
const LINE_BREAKS = /\r\n?|[\u2028\u2029\u0085\v\f]/g;
export const normalizeBreaks = (text: string) => text.replace(LINE_BREAKS, '\n');
const MD_HEADING = /^\s*#{1,6}\s+/;

const clean = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const stripBold = (s: string) => s.replace(/^\*\*(.+)\*\*:?$/, '$1').replace(/^__(.+)__:?$/, '$1');

const isBullet = (l: string) => !/^\s*\*\*/.test(l) && BULLET.test(l) && clean(l.replace(BULLET, '')).length > 0;
const isNumbered = (l: string) => NUMBERED.test(l);

/** A short title-like line: "Primary Role", "Key Responsibilities", "Required Skills:" */
function looksLikeHeading(line: string, next: string | undefined) {
  const t = clean(line);
  if (!t || isBullet(line)) return false;
  if (MD_HEADING.test(line) || /^\*\*.+\*\*:?$/.test(t)) return true;
  if (t.endsWith(':') && t.length <= 120) return true;
  if (next === undefined) return false; // a heading needs something under it
  const words = t.split(' ').length;
  return t.length <= 60 && words <= 8 && !/[.!?,;]$/.test(t) && /^[A-Z0-9]/.test(t);
}

/** Legacy jobs: every line is one point. */
export function legacyPoints(text?: string) {
  return normalizeBreaks(text || '').split('\n').map((l) => clean(l.replace(/^[-*•]\s*/, ''))).filter(Boolean);
}

/** PDF copies often put the "•" on its own line with the text on the next one: join them. */
function mergeLoneBullets(lines: string[]) {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (BULLET.test(lines[i]) && !clean(lines[i].replace(BULLET, '')) && !/^\s*[-*_]{3,}\s*$/.test(lines[i])) {
      let j = i + 1;
      while (j < lines.length && !clean(lines[j])) j++;
      if (j < lines.length && !BULLET.test(lines[j])) {
        out.push(`• ${lines[j]}`);
        i = j;
      }
      continue; // a stray bullet with nothing after it is dropped
    }
    out.push(lines[i]);
  }
  return out;
}

const CONNECTOR = /^(?:and|&|of|for|the|in|to|on|with|\/)$/i;
const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * Text that lost its line breaks (e.g. a JD pasted into the old one-line boxes) reads like
 * "Key Responsibilities 1. Planning and Design Review and coordinate ... 2. Project Execution Supervise ...".
 * When a long line carries an inline 1., 2., 3. sequence, rebuild it as headings and bullet points.
 * Returns null when the line doesn't look like that.
 */
export function expandBlob(line: string): string[] | null {
  const t = clean(line);
  if (t.length < 250) return null;
  const marks: { at: number; n: number; len: number }[] = [];
  const re = /(^|\s)(\d{1,2})\.\s*(?=[A-Z])/g;
  let m: RegExpExecArray | null;
  let expect = 1;
  while ((m = re.exec(t))) {
    if (Number(m[2]) !== expect) continue; // only a clean 1, 2, 3... sequence
    marks.push({ at: m.index + m[1].length, n: expect, len: m[0].length - m[1].length });
    expect++;
  }
  if (marks.length < 2) return null;

  const out: string[] = [];
  const intro = t.slice(0, marks[0].at).trim();
  if (intro) {
    if (intro.length <= 60 && !/[.!?,;]$/.test(intro)) out.push(`${intro.replace(/:$/, '')}:`);
    else out.push(...sentences(intro));
  }
  marks.forEach((mk, i) => {
    const body = t.slice(mk.at + mk.len, i + 1 < marks.length ? marks[i + 1].at : t.length).trim();
    // Title words run until the sentence starts: "Planning and Design | Review and coordinate ..."
    const words = body.split(' ');
    let k = 0;
    while (k < words.length && (/^[A-Z&]/.test(words[k]) || CONNECTOR.test(words[k]))) k++;
    while (k > 0 && CONNECTOR.test(words[k - 1])) k--; // "...Review and | coordinate"
    let titleEnd = k - 1; // the last capitalised word starts the first sentence
    while (titleEnd > 0 && CONNECTOR.test(words[titleEnd - 1])) titleEnd--;
    const title = titleEnd >= 1 && titleEnd <= 8 ? words.slice(0, titleEnd).join(' ') : '';
    const rest = title ? words.slice(titleEnd).join(' ') : body;
    out.push('');
    if (title) {
      out.push(`${mk.n}. ${title}`);
      sentences(rest).forEach((x) => out.push(`• ${x}`));
    } else {
      const [first, ...more] = sentences(rest);
      out.push(`${mk.n}. ${first || rest}`);
      more.forEach((x) => out.push(`• ${x}`));
    }
  });
  return out;
}

/** Turn pasted plain text into display blocks. */
export function parseJobText(text?: string): JobTextBlock[] {
  const lines = mergeLoneBullets(normalizeBreaks(text || '').split('\n')).flatMap((l) => expandBlob(l) ?? [l]);
  const blocks: JobTextBlock[] = [];
  const nextNonEmpty = (i: number) => {
    for (let j = i + 1; j < lines.length; j++) if (clean(lines[j])) return lines[j];
    return undefined;
  };
  const lastList = (ordered: boolean) => {
    const b = blocks[blocks.length - 1];
    return b && b.type === 'list' && b.ordered === ordered ? b : null;
  };
  let paraOpen = false; // consecutive text lines join into one paragraph
  let listOpen = false; // the line right above was a list item (a lowercase line under it is its wrapped tail)

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = clean(raw);
    if (!t) {
      // Blank lines end a paragraph but not a list (PDF pastes put blank lines between bullets).
      paraOpen = false;
      listOpen = false;
      continue;
    }
    const next = nextNonEmpty(i);

    if (isBullet(raw)) {
      const item = clean(raw.replace(BULLET, ''));
      const list = lastList(false);
      if (list) list.items.push(item);
      else blocks.push({ type: 'list', ordered: false, items: [item] });
      paraOpen = false;
      listOpen = true;
      continue;
    }

    const prevBlock = blocks[blocks.length - 1];
    if (listOpen && prevBlock?.type === 'list' && /^[a-z(&]/.test(t)) {
      prevBlock.items[prevBlock.items.length - 1] += ` ${t}`;
      continue;
    }

    if (isNumbered(raw)) {
      // "1. Strategy Development" followed by bullets or plain lines is a sub-heading; otherwise a numbered point.
      const titleLike = t.length <= 60 && !/[.!?,;]$/.test(t);
      const midList = lastList(true) !== null; // "2." right after "1." item: keep the numbered list going
      const directlyFollowed = !!clean(lines[i + 1] ?? '');
      if (next && t.length <= 80 && (isBullet(next) || (titleLike && !midList && directlyFollowed && !isNumbered(next)))) {
        blocks.push({ type: 'heading', text: stripBold(t.replace(/^(\d{1,2}[.)])(?=[A-Za-z])/, '$1 ')).replace(/:$/, ''), sub: true });
        listOpen = false;
      } else {
        const item = clean(raw.replace(NUMBERED, ''));
        const list = lastList(true);
        const n = Number((t.match(/^(\d{1,2})/) || [])[1]);
        if (list) list.items.push(item);
        else blocks.push({ type: 'list', ordered: true, items: [item], start: Number.isFinite(n) && n > 0 ? n : 1 });
        listOpen = true;
      }
      paraOpen = false;
      continue;
    }

    // A run of 2+ lines (no blank line between) that each start with a capital and end a sentence,
    // e.g. points typed without "•", reads best as a bullet list.
    if (!paraOpen && !t.endsWith(':')) {
      const run: string[] = [];
      for (let j = i; j < lines.length; j++) {
        const lj = clean(lines[j]);
        if (!lj || isBullet(lines[j]) || isNumbered(lines[j]) || (j > i && lj.endsWith(':') && lj.length <= 120)) break;
        run.push(lj);
      }
      const pointLike = (x: string, k: number) =>
        /^[A-Z0-9"'(]/.test(x) && (k === run.length - 1 || /[.!?;)]$/.test(x) || x.length <= 90) && !/[,]$/.test(x);
      const underSubHeading = prevBlock?.type === 'heading' && !!prevBlock.sub;
      const shortPoints = prevBlock?.type === 'heading' && run.every((x) => x.length <= 90 && !/\.$/.test(x));
      if ((run.length >= 3 || (run.length >= 2 && (underSubHeading || shortPoints))) && run.every((x) => x.length <= 180) && run.every(pointLike) && run.slice(0, -1).every((x) => /[.!?;)]$/.test(x) || x.length <= 90)) {
        blocks.push({ type: 'list', ordered: false, items: run });
        i += run.length - 1;
        listOpen = true;
        continue;
      }
    }

    const afterSentence = prevBlock?.type === 'para' && /[.!?]$/.test(prevBlock.text);
    if ((!paraOpen || afterSentence) && looksLikeHeading(raw, next)) {
      paraOpen = false;
      blocks.push({ type: 'heading', text: stripBold(clean(raw.replace(MD_HEADING, ''))).replace(/:$/, '') });
      listOpen = false;
      continue;
    }

    listOpen = false;
    const prev = blocks[blocks.length - 1];
    // A line that doesn't end a sentence was wrapped by the PDF/editor: keep it on the same line.
    if (paraOpen && prev?.type === 'para') prev.text += /[.!?:;)]$/.test(prev.text) ? `\n${t}` : ` ${t}`;
    else blocks.push({ type: 'para', text: t });
    paraOpen = true;
  }
  return blocks;
}

/** Blocks for any job field, old or new format. */
export function jobTextBlocks(text: string | undefined, format?: Job['descriptionFormat']): JobTextBlock[] {
  if (format === 'text') return parseJobText(text);
  const items = legacyPoints(text);
  if (items.length === 1 && expandBlob(items[0])) return parseJobText(items[0]);
  if (items.length <= 1) return items.length ? [{ type: 'para', text: items[0] }] : [];
  return [{ type: 'list', ordered: false, items }];
}

/**
 * Clean up text as it is pasted into the description box, so the box stays short and readable:
 * "•" alone on a line is joined to its text, odd bullet glyphs become "•", blank lines between bullets go,
 * and runs of blank lines shrink to one. Words are never changed.
 */
export function tidyPastedText(text: string) {
  const lines = mergeLoneBullets(normalizeBreaks(text).replace(/\u00a0/g, ' ').split('\n')).map((l) =>
    isBullet(l) ? `• ${clean(l.replace(BULLET, ''))}` : l.replace(/[ \t]+$/, '')
  );
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const prev = out[out.length - 1];
      // Drop blank lines between two bullets, and leading/duplicate blanks.
      if (!prev || !prev.trim() || j >= lines.length || (isBullet(prev) && isBullet(lines[j]))) continue;
      out.push('');
      continue;
    }
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}

/** Old one-point-per-line text, shown in the new single box as "• point" lines. */
export function pointsToText(text?: string) {
  const items = legacyPoints(text);
  if (items.length === 1) return expandBlob(items[0])?.join('\n').trim() ?? items[0];
  return items.map((i) => `• ${i}`).join('\n');
}

const unbold = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1');

/** Plain text for pasting into LinkedIn / Indeed / Naukri. */
export function blocksToPlainText(blocks: JobTextBlock[]) {
  return blocks
    .map((b) => {
      if (b.type === 'heading' && b.sub) return `\n${unbold(b.text)}`;
      if (b.type === 'heading') return `\n${unbold(b.text).toUpperCase()}`;
      if (b.type === 'para') return unbold(b.text);
      return b.items.map((it, i) => `${b.ordered ? `${(b.start ?? 1) + i}.` : '•'} ${unbold(it)}`).join('\n');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


const escapeHtml = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/** Simple HTML (for Google Jobs structured data). */
export function blocksToHtml(blocks: JobTextBlock[]) {
  return blocks
    .map((b) => {
      if (b.type === 'heading') return `<p><strong>${escapeHtml(b.text)}</strong></p>`;
      if (b.type === 'para') return `<p>${escapeHtml(b.text).replace(/\n/g, '<br>')}</p>`;
      const tag = b.ordered ? 'ol' : 'ul';
      const start = b.ordered && b.start && b.start > 1 ? ` start="${b.start}"` : '';
      return `<${tag}${start}>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`;
    })
    .join('');
}

/** A one-paragraph summary for link previews and search results. */
export function jobSummary(job: Pick<Job, 'description' | 'descriptionFormat'>, max = 200) {
  const blocks = jobTextBlocks(job.description, job.descriptionFormat);
  const para = blocks.find((b) => b.type === 'para');
  const text = (para?.type === 'para'
    ? para.text.replace(/\n/g, ' ')
    : blocks.flatMap((b) => (b.type === 'list' ? b.items : b.type === 'para' ? [b.text] : [])).join(' ')).replace(/\*\*/g, '');
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text;
}

/** Ticked qualification boxes plus any extra requirements text. */
export function hasQualifications(job: Pick<Job, 'qualifications' | 'qualificationTags'>) {
  return !!(job.qualificationTags?.length || job.qualifications?.trim());
}
