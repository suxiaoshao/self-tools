import { useState } from 'react';

export interface UseDialogOptions {
  initOpen?: boolean;
}

export default function useDialog({ initOpen = false }: UseDialogOptions = {}) {
  const [open, setOpen] = useState(initOpen);
  return {
    open,
    handleClose: () => setOpen(false),
    handleOpen: () => setOpen(true),
  };
}
