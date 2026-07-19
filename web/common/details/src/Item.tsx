/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-04-30 00:42:28
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-01 02:47:11
 * @FilePath: /tauri/common/details/src/Item.tsx
 */
import type { DetailsItem } from './types';
import type { CSSProperties } from 'react';
import { match, P } from 'ts-pattern';
import { cn } from '@portal/lib/utils';
import { FieldDescription, FieldLabel } from '@portal/components/ui/field';

type ItemStyle = CSSProperties & { '--span': number | undefined };

export default function Item({ label, value, span }: Omit<DetailsItem, 'key'>) {
  const style: ItemStyle = { '--span': span };

  return (
    <div className={cn('flex flex-col col-span-(--span)')} style={style}>
      <FieldLabel>{label}</FieldLabel>
      {match(value)
        .with(P.string.or(P.nullish), (value) => <FieldDescription>{value ?? '-'}</FieldDescription>)
        .otherwise((value) => value)}
    </div>
  );
}
