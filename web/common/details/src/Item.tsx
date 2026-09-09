import type { DetailsItem } from './types';
import type { CSSProperties } from 'react';
import { match, P } from 'ts-pattern';
import { cn } from 'ui/lib/utils';
import { FieldDescription, FieldLabel } from 'ui/components/field';

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
