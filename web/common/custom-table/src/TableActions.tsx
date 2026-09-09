import { useI18n } from 'i18n';
import { Button } from 'ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/components/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactNode, JSX } from 'react';
import { match, P } from 'ts-pattern';

interface TableActionsProps {
  children: () => Actions[];
  triggerId?: string;
}

type Actions =
  | {
      text: ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }
  | JSX.Element;

export function TableActions({ children, triggerId }: TableActionsProps) {
  const t = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={triggerId}
        render={<Button variant="ghost" size="icon" className="data-[state=open]:bg-muted size-8" />}
      >
        <MoreHorizontal />
        <span className="sr-only">{t('open_menu')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          {children().map((item) =>
            match(item)
              .with({ text: P._ }, ({ text, onClick, disabled }) => (
                <DropdownMenuItem key={JSON.stringify(text)} onClick={onClick} disabled={disabled}>
                  {text}
                </DropdownMenuItem>
              ))
              .otherwise((element) => element),
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
