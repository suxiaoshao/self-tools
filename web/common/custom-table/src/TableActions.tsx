import { MoreHoriz } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { ReactNode, useState } from 'react';

export interface TableActionsProps {
  children: (handleClose: () => void) => Actions[];
}

export type Actions =
  | {
      text: ReactNode;
      onClick?: () => void;
    }
  | JSX.Element;

export function TableActions({ children }: TableActionsProps): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreHoriz />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {children(handleClose).map((Item, index) => {
          if ('text' in Item) {
            return (
              <MenuItem
                onClick={() => {
                  Item.onClick?.();
                }}
                key={index}
              >
                {Item.text}
              </MenuItem>
            );
          }
          return Item;
        })}
      </Menu>
    </>
  );
}
