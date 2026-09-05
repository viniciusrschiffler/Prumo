import { parseInlineMarkdown, splitParagraphs } from '@/domain/format/inlineMarkdown'
import { classNames } from './classNames'

type MarkdownTextProps = {
  text: string
  className?: string
}

export function MarkdownText({ text, className }: MarkdownTextProps) {
  return (
    <div className={classNames('grid gap-1.5 text-pretty', className)}>
      {splitParagraphs(text).map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex}>
          {parseInlineMarkdown(paragraph).map((segment, segmentIndex) =>
            segment.isBold ? (
              <strong key={segmentIndex} className="font-semibold text-text">
                {segment.text}
              </strong>
            ) : (
              <span key={segmentIndex}>{segment.text}</span>
            ),
          )}
        </p>
      ))}
    </div>
  )
}
