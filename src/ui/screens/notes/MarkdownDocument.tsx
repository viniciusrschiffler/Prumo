import { Fragment } from 'react'
import type { MarkdownBlock, TableAlignment } from '@/domain/notes/markdownBlocks'
import type { MarkdownInline } from '@/domain/notes/markdownInline'
import { classNames } from '@/ui/primitives/classNames'

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-article-title',
  2: 'text-section-title',
  3: 'text-section-title',
}

const ALIGNMENT_CLASSES: Record<TableAlignment, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function Inline({ segments }: { segments: readonly MarkdownInline[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        const text = segment.code ? (
          <code
            key={index}
            className="rounded-[3px] border border-border bg-sunken px-1 font-mono text-[0.9em]"
          >
            {segment.text}
          </code>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )

        const styled = (
          <span
            key={index}
            className={classNames(
              segment.bold ? 'font-semibold text-text' : '',
              segment.italic ? 'italic' : '',
            )}
          >
            {text}
          </span>
        )

        // O link é texto: a nota vive numa janela sem navegador, e abrir origem remota
        // contraria a regra de rede zero. O destino fica visível no title.
        return segment.href === null ? (
          styled
        ) : (
          <span key={index} title={segment.href} className="text-accent underline">
            {styled}
          </span>
        )
      })}
    </>
  )
}

function Block({ block }: { block: MarkdownBlock }) {
  if (block.kind === 'heading') {
    const Tag = `h${Math.min(block.level + 1, 6)}` as 'h2'

    return (
      <Tag className={classNames('mt-1.5', HEADING_CLASSES[block.level] ?? 'text-body font-semibold')}>
        <Inline segments={block.content} />
      </Tag>
    )
  }

  if (block.kind === 'paragraph') {
    return (
      <p className="whitespace-pre-wrap text-pretty text-[14px] leading-[1.65] text-text2">
        <Inline segments={block.content} />
      </p>
    )
  }

  if (block.kind === 'list') {
    const Tag = block.ordered ? 'ol' : 'ul'

    return (
      <Tag
        className={classNames(
          'grid gap-[5px] pl-5 text-[14px] leading-[1.6] text-text2',
          block.ordered ? 'list-decimal' : 'list-disc',
        )}
      >
        {block.items.map((item, index) => (
          <li key={index}>
            <Inline segments={item} />
          </li>
        ))}
      </Tag>
    )
  }

  if (block.kind === 'code') {
    return (
      <pre className="overflow-auto rounded-card border border-border bg-sunken px-[13px] py-[11px] font-mono text-support leading-[1.6] text-text2">
        {block.text}
      </pre>
    )
  }

  if (block.kind === 'callout') {
    return (
      <div className="grid gap-1 rounded-card border border-l-2 border-border border-l-accent bg-sunken px-[13px] py-[11px]">
        {block.label !== null && (
          <span className="text-column uppercase text-text3">{block.label}</span>
        )}
        <span className="whitespace-pre-wrap text-body text-text2">
          <Inline segments={block.content} />
        </span>
      </div>
    )
  }

  if (block.kind === 'table') {
    return (
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-sunken">
              {block.header.map((cell, index) => (
                <th
                  key={index}
                  className={classNames(
                    'px-[11px] py-[7px] text-column uppercase text-text2',
                    ALIGNMENT_CLASSES[block.alignments[index] ?? 'left'],
                  )}
                >
                  <Inline segments={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={classNames(
                      'px-[11px] py-2 text-body',
                      ALIGNMENT_CLASSES[block.alignments[cellIndex] ?? 'left'],
                      cellIndex === 0 ? '' : 'font-mono text-support tabular-nums',
                    )}
                  >
                    <Inline segments={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <hr className="border-0 border-t border-border" />
}

type MarkdownDocumentProps = {
  blocks: readonly MarkdownBlock[]
}

export function MarkdownDocument({ blocks }: MarkdownDocumentProps) {
  return (
    <div className="grid gap-3.5">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}
