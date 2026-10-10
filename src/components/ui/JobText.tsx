import { Fragment } from 'react';
import { jobTextBlocks, type JobTextBlock } from '@/lib/jobText';
import type { Job } from '@/types';

/** **bold** from LinkedIn/markdown pastes becomes real bold; everything else is plain text. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\*\*[^*]+\*\*$/.test(p) ? (
          <strong key={i} className="font-semibold text-gray-800">{p.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}

export function JobTextBlocks({ blocks, compact = false }: { blocks: JobTextBlock[]; compact?: boolean }) {
  const gap = compact ? 'space-y-3' : 'space-y-4';
  return (
    <div className={`${gap} min-w-0 text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]`}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return b.sub ? (
            <h4 key={i} className={`font-semibold text-navy ${i ? 'pt-1' : ''}`}>
              <Inline text={b.text} />
            </h4>
          ) : (
            <h3 key={i} className={`text-base font-bold text-navy ${i ? (compact ? 'pt-2' : 'pt-3') : ''}`}>
              <Inline text={b.text} />
            </h3>
          );
        }
        if (b.type === 'para') {
          return (
            <p key={i} className="whitespace-pre-line">
              <Inline text={b.text} />
            </p>
          );
        }
        if (b.ordered) {
          return (
            <ol key={i} className="space-y-2.5">
              {b.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 min-w-[1.25rem] flex-shrink-0 px-1 items-center justify-center rounded-full bg-ocean/10 text-[11px] font-bold text-ocean">
                    {(b.start ?? 1) + j}
                  </span>
                  <span className="min-w-0"><Inline text={item} /></span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={i} className="space-y-2.5">
            {b.items.map((item, j) => (
              <li key={j} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-br from-ocean to-cyan" />
                <span className="min-w-0"><Inline text={item} /></span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

/** Renders a job's description / responsibilities / extra qualifications in either the old or new format. */
export default function JobText({
  text,
  format,
  compact,
}: {
  text?: string;
  format?: Job['descriptionFormat'];
  compact?: boolean;
}) {
  const blocks = jobTextBlocks(text, format);
  if (!blocks.length) return null;
  return <JobTextBlocks blocks={blocks} compact={compact} />;
}
