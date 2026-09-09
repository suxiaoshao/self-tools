import { AlertDialog } from '@base-ui/react/alert-dialog';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Button } from './components/button';
import { DialogHeader, DialogFooter } from './components/dialog';

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
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
        <AlertDialog.Popup
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
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          <DialogHeader>
            <AlertDialog.Title className="text-base font-medium">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground">{description}</AlertDialog.Description>
          </DialogHeader>
          {notice}
          <DialogFooter>
            <Button
              ref={cancel}
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmDisabled || pending}
              aria-busy={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
