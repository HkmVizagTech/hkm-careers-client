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
  | { type: 'list'; ordered: boolean; items: string[] };

// •, ●, ▪, ◦, ‣, ∙, ·, -, *, –, —, ➢, ►, ▶, ➤, ✓, ✔, ❖, ■, □, and Word/PDF symbol-font bullets.
const BULLET = /^\s*(?:[•●▪◦‣∙·*\-–—➢►▶➤✓✔❖■□○])\s*/;
const NUMBERED = /^\s*(?:\d{1,2}|[a-hA-H])[.)]\s+/;
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
  if (t.endsWith(':') && t.length <= 80) return true;
  if (next === undefined) return false; // a heading needs something under it
  const words = t.split(' ').length;
  return t.length <= 60 && words <= 8 && !/[.!?,;]$/.test(t) && /^[A-Z0-9]/.test(t);
}

/** Legacy jobs: every line is one point. */
export function legacyPoints(text?: string) {
  return (text || '').split('\n').map((l) => clean(l.replace(/^[-*•]\s*/, ''))).filter(Boolean);
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

/** Turn pasted plain text into display blocks. */
export function parseJobText(text?: string): JobTextBlock[] {
  const lines = mergeLoneBullets((text || '').replace(/\r\n?/g, '\n').split('\n'));
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
      // "1. Strategy Development" followed by bullets is a sub-heading; otherwise a numbered point.
      if (next && isBullet(next) && t.length <= 80) {
        blocks.push({ type: 'heading', text: stripBold(t).replace(/:$/, ''), sub: true });
      } else {
        const item = clean(raw.replace(NUMBERED, ''));
        const list = lastList(true);
        if (list) list.items.push(item);
        else blocks.push({ type: 'list', ordered: true, items: [item] });
        listOpen = true;
      }
      paraOpen = false;
      continue;
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
  if (items.length <= 1) return items.length ? [{ type: 'para', text: items[0] }] : [];
  return [{ type: 'list', ordered: false, items }];
}

/**
 * Clean up text as it is pasted into the description box, so the box stays short and readable:
 * "•" alone on a line is joined to its text, odd bullet glyphs become "•", blank lines between bullets go,
 * and runs of blank lines shrink to one. Words are never changed.
 */
export function tidyPastedText(text: string) {
  const lines = mergeLoneBullets(text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').split('\n')).map((l) =>
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
  return items.length <= 1 ? items.join('') : items.map((i) => `• ${i}`).join('\n');
}

const unbold = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1');

/** Plain text for pasting into LinkedIn / Indeed / Naukri. */
export function blocksToPlainText(blocks: JobTextBlock[]) {
  return blocks
    .map((b) => {
      if (b.type === 'heading' && b.sub) return `\n${unbold(b.text)}`;
      if (b.type === 'heading') return `\n${unbold(b.text).toUpperCase()}`;
      if (b.type === 'para') return unbold(b.text);
      return b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : '•'} ${unbold(it)}`).join('\n');
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
      return `<${tag}>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`;
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
