import { Menu, MenuItem } from '@mui/material';
import React, {
  FocusEvent,
  FocusEventHandler,
  ForwardedRef,
  Key,
  MouseEvent,
  ReactNode,
  useImperativeHandle,
  useState,
} from 'react';

export interface CustomSelectorProps<T> {
  children?: { value: T; label: ReactNode; key: Key }[];
  onChange: (event: { target: { value: T } }, newValue: T) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  value: T;
  render?: (onClick: (event: MouseEvent<HTMLButtonElement>) => void) => ReactNode;
}

function CustomSelector<T>(
  { children, onBlur, onChange, render, value }: CustomSelectorProps<T>,
  ref: ForwardedRef<HTMLDivElement | null>,
): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    onBlur?.(undefined as unknown as FocusEvent<HTMLInputElement>);
  };
  const [sourceRef, setSourceRef] = useState<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => sourceRef, [sourceRef]);

  return (
    <>
      {render?.(handleClick)}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} ref={setSourceRef}>
        {children?.map(({ value: itemValue, label, key }) => (
          <MenuItem
            onClick={() => {
              onChange({ target: { value: itemValue } }, itemValue);
              handleClose();
            }}
            selected={itemValue === value}
            key={key}
          >
            {label}
          </MenuItem>
        ))}
        {(children?.length ?? 0) === 0 && <MenuItem disabled>No options</MenuItem>}
      </Menu>
    </>
  );
}

export default React.forwardRef(CustomSelector) as typeof CustomSelector;
