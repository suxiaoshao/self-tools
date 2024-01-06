/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-07 04:49:44
 * @FilePath: /self-tools/web/common/notify/src/index.tsx
 */
import { IconButton } from '@mui/material';
import { OptionsObject, SnackbarMessage, useSnackbar, SnackbarProvider as SourceSnackbarProvider } from 'notistack';
import { ReactNode, useEffect, useRef } from 'react';
import { Subject } from 'rxjs';
import { Close } from '@mui/icons-material';

export type SnackbarData = [SnackbarMessage, OptionsObject?];
const snackbarSubject = new Subject<SnackbarData>();
export function enqueueSnackbar(...data: SnackbarData) {
  snackbarSubject.next(data);
}
function useSnackbarInit() {
  const { enqueueSnackbar: open } = useSnackbar();
  useEffect(() => {
    const key = snackbarSubject.subscribe((data) => {
      open(...data);
    });
    return () => {
      key.unsubscribe();
    };
  }, [open]);
}
export function SnackbarProvider({ children }: { children: ReactNode }): JSX.Element {
  const ref = useRef<SourceSnackbarProvider>(null);
  function InnerUseComponent() {
    useSnackbarInit();
    return children;
  }
  return (
    <SourceSnackbarProvider
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      maxSnack={5}
      ref={ref}
      action={(key) => (
        <IconButton
          onClick={() => {
            ref.current?.closeSnackbar(key);
          }}
        >
          <Close sx={{ color: '#fff' }} />
        </IconButton>
      )}
      variant="error"
    >
      <InnerUseComponent />
    </SourceSnackbarProvider>
  );
}
