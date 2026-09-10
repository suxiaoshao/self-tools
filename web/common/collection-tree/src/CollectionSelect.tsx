import { useId, type Ref } from 'react';
import { FieldError } from 'ui/components/field';
import { CollectionPicker } from './CollectionPicker';
import type { CollectionOption } from './tree';

export interface CollectionSelectProps {
  allCollections: ReadonlyMap<number, CollectionOption>;
  value: number | null;
  onChange: (value: number | null) => void;
  errorMessage?: string;
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function CollectionSelect({
  allCollections,
  value,
  onChange,
  errorMessage,
  disabled,
  ref,
}: CollectionSelectProps) {
  const errorId = useId();
  return (
    <div ref={ref} tabIndex={-1} data-invalid={!!errorMessage} aria-describedby={errorMessage ? errorId : undefined}>
      <CollectionPicker
        allCollections={allCollections}
        value={value == null ? [] : [value]}
        onChange={(next) => onChange(next[0] ?? null)}
        disabled={disabled}
        errorId={errorMessage ? errorId : undefined}
        triggerLabel={value == null ? undefined : (allCollections.get(value)?.path ?? `#${value}`)}
      />
      <FieldError id={errorId} errors={[{ message: errorMessage }]} />
    </div>
  );
}
