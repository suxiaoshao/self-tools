/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-04-30 00:05:48
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-01 02:48:14
 * @FilePath: /tauri/common/details/src/Details.tsx
 */
import { Box, BoxProps } from '@mui/material';
import Item from './Item';
import { DetailsItem } from './types';

export interface DetailsProps extends BoxProps {
  items: DetailsItem[];
  fullSpan?: number;
}

export default function Details({ sx, items, fullSpan = 3, ...props }: DetailsProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${fullSpan}, 1fr)`, gap: 2, ...sx }} {...props}>
      {items.map(({ key, ...props }) => (
        <Item key={key ?? props.label} {...props} />
      ))}
    </Box>
  );
}
