import Item from './Item';
import type { DetailsItem } from './types';
import type { ComponentProps, CSSProperties } from 'react';
import { cn } from 'ui/lib/utils';

type DetailsStyle = CSSProperties & { '--fullSpan': number };

export interface DetailsProps extends ComponentProps<'div'> {
  items: DetailsItem[];
  fullSpan?: number;
}

export default function Details({ className, items, fullSpan = 3, ...props }: DetailsProps) {
  const style: DetailsStyle = { '--fullSpan': fullSpan };

  return (
    <div className={cn(`grid grid-cols-[repeat(var(--fullSpan),1fr)] gap-2`, className)} style={style} {...props}>
      {items.map(({ key, ...props }) => (
        <Item key={key ?? props.label} {...props} />
      ))}
    </div>
  );
}
