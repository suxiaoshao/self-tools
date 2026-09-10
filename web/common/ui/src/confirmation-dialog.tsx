import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/alert-dialog';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  confirmDisabled: boolean;
  onConfirm: () => void;
  notice?: ReactNode;
  returnFocus?: () => HTMLElement | null;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending,
  confirmDisabled,
  onConfirm,
  notice,
  returnFocus,
}: ConfirmationDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const returnContainer = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const menu = active?.closest('[role="menu"]');
    const triggerId = menu?.getAttribute('aria-labelledby');
    const trigger = returnFocus?.() ?? (triggerId ? document.getElementById(triggerId) : active);
    returnTo.current = trigger;
    returnContainer.current = trigger?.closest('main, [data-slot="sidebar-inset"]') ?? null;
  }, [open, returnFocus]);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent
        initialFocus={cancel}
        finalFocus={() => {
          if (returnTo.current?.isConnected) return returnTo.current;
          const replacement = returnTo.current?.id ? document.getElementById(returnTo.current.id) : null;
          if (replacement) return replacement;
          return (
            returnContainer.current?.querySelector<HTMLElement>('button:not(:disabled), a[href]') ??
            document.querySelector<HTMLElement>(
              'main button:not(:disabled), main a[href], [data-slot="sidebar-trigger"]',
            ) ??
            false
          );
        }}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {notice}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancel} type="button" variant="secondary" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={confirmDisabled || pending}
            aria-busy={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
