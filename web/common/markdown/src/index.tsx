import { useI18n } from 'i18n';
import React, { type ComponentProps, useEffect, useRef, useState } from 'react';
import MarkdownSource, { type MarkdownToJSX } from 'markdown-to-jsx';
import { Separator } from 'ui/components/separator';
import { Button } from 'ui/components/button';
import './typeset.css';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui/components/table';

interface MarkdownProps extends ComponentProps<'div'> {
  value: string;
}

function CustomImage({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} {...props} />;
}

function CustomLink({ children, ...props }: ComponentProps<'a'>) {
  return (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function CustomPre({ children }: { children: React.ReactNode }) {
  const pre = useRef<HTMLPreElement>(null);
  const t = useI18n();
  const [copyState, setCopyState] = useState<'copy' | 'copied' | 'copy_failed'>('copy');
  const language = React.isValidElement<{ className?: string }>(children)
    ? /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i.exec(children.props.className ?? '')?.[1]
    : undefined;
  return (
    <div className="not-typeset my-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{language}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(pre.current?.querySelector('code')?.textContent ?? '');
              setCopyState('copied');
            } catch {
              setCopyState('copy_failed');
            }
          }}
        >
          {t(copyState)}
        </Button>
      </div>
      <pre
        ref={pre}
        className={`line-numbers rounded bg-muted p-4 font-mono text-foreground overflow-auto${language ? ` language-${language}` : ''}`}
      >
        {children}
      </pre>
    </div>
  );
}

const option: MarkdownToJSX.Options = {
  overrides: {
    img: CustomImage,
    a: CustomLink,
    pre: CustomPre,
    table: Table,
    thead: TableHeader,
    tr: TableRow,
    tbody: TableBody,
    td: TableCell,
    th: TableHead,
    hr: Separator,
  },
};
export default function CustomMarkdown({ value, ...props }: MarkdownProps) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = container.current;
    if (!target?.querySelector('pre code')) return;
    let active = true;
    void import('./init').then(({ highlight }) => highlight(target, () => active)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [value]);
  return (
    <div {...props} ref={container}>
      <MarkdownSource key={value} className="typeset size-full" options={option}>
        {value}
      </MarkdownSource>
    </div>
  );
}
