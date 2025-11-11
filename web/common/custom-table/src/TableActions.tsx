import { Button } from '@portal/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@portal/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactNode, JSX } from 'react';
import { match, P } from 'ts-pattern';

export interface TableActionsProps {
  children: () => Actions[];
}

export type Actions =
  | {
      text: ReactNode;
      onClick?: () => void;
    }
  | JSX.Element;

export function TableActions({ children }: TableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="data-[state=open]:bg-muted size-8">
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {children().map((item) =>
          match(item)
            .with({ text: P._ }, ({ text, onClick }) => (
              <DropdownMenuItem key={JSON.stringify(text)} onClick={onClick}>
                {text}
              </DropdownMenuItem>
            ))
            .otherwise((element) => element),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
