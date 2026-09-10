import type { ComponentProps, JSX } from 'react';
import { SidebarTrigger } from './components/sidebar';
import { cn } from './lib/utils';

export type PageToolbarProps = ComponentProps<'header'>;

export function PageToolbar({ children, className, ...props }: PageToolbarProps): JSX.Element {
  return (
    <header
      data-slot="page-toolbar"
      className={cn('flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2', className)}
      {...props}
    >
      <SidebarTrigger type="button" className="shrink-0" />
      {children}
    </header>
  );
}
