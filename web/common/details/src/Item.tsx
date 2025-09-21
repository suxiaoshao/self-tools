/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-04-30 00:42:28
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-01 02:47:11
 * @FilePath: /tauri/common/details/src/Item.tsx
 */
import { Box, Typography } from '@mui/material';
import type { DetailsItem } from './types';
import { match, P } from 'ts-pattern';

export default function Item({ label, value, span }: Omit<DetailsItem, 'key'>) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        ...match(span)
          .with(P.nonNullable, () => ({ gridColumn: `span ${span}` }))
          .otherwise(() => ({})),
      }}
    >
      <Typography variant="subtitle1">{label}</Typography>
      <Typography
        variant="body1"
        {...match(value)
          .with(P.string.or(P.nullish), () => null)
          .otherwise(() => ({ component: 'div' as const }))}
      >
        {value ?? '-'}
      </Typography>
    </Box>
  );
}
