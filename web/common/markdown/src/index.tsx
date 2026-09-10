import { useI18n } from 'i18n';
import React, { type ComponentProps, type JSX, useEffect, useRef, useState } from 'react';
import MarkdownSource, { type MarkdownToJSX } from 'markdown-to-jsx';
import { match, P } from 'ts-pattern';
import { Separator } from 'ui/components/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui/components/table';

interface MarkdownProps extends ComponentProps<'div'> {
  value: string;
}

function CustomImage({ alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} {...props} />;
}

function CustomLink(props: { title: string; href: string; children: string }) {
  return (
    <a title={props.title} href={props.href} target="_blank" className="inline-block ml-1 mr-1 underline text-blue-700">
      {props.children}
    </a>
  );
}

function CustomCode(props: { children: string; className?: string }) {
  if (props.className) {
    return <code className={props.className}>{props.children}</code>;
  }
  return (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {props.children}
    </code>
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
    <div className="my-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{language}</span>
        <button
          type="button"
          className="rounded border px-2 text-sm"
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
        </button>
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

function CustomListItem(props: { children: JSX.Element[] }) {
  return (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
      {props.children.map((value) =>
        match(value)
          .with(P.string, (value) => <li key={JSON.stringify(value)}>{value}</li>)
          .otherwise((value) => value),
      )}
    </ul>
  );
}

function TypographyH1({ children }: { children: JSX.Element }) {
  return <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">{children}</h1>;
}

function TypographyH2({ children }: { children: JSX.Element }) {
  return <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{children}</h2>;
}

function TypographyH3({ children }: { children: JSX.Element }) {
  return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>;
}

function TypographyH4({ children }: { children: JSX.Element }) {
  return <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h4>;
}

function TypographyP({ children }: { children: JSX.Element }) {
  return <p className="leading-7 not-first:mt-6">{children}</p>;
}

function TypographyBlockquote({ children }: { children: JSX.Element }) {
  return <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>;
}

const option: MarkdownToJSX.Options = {
  overrides: {
    h1: TypographyH1,
    h2: TypographyH2,
    h3: TypographyH3,
    h4: TypographyH4,
    p: TypographyP,
    img: CustomImage,
    a: CustomLink,
    code: CustomCode,
    pre: CustomPre,
    ul: CustomListItem,
    table: Table,
    thead: TableHeader,
    tr: TableRow,
    tbody: TableBody,
    td: TableCell,
    th: TableHead,
    hr: Separator,
    blockquote: TypographyBlockquote,
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
      <MarkdownSource key={value} className="size-full" options={option}>
        {value}
      </MarkdownSource>
    </div>
  );
}
