import { RequestNotice } from 'custom-graphql';
import { CollectionMultiSelect as CollectionMultiSelectView } from 'collection-tree';
import { type ComponentProps, type FocusEventHandler, type Ref, useImperativeHandle, useState } from 'react';
import { cn } from 'ui/lib/utils';
import { Spinner } from 'ui/components/spinner';
import { CollectionLoadingState, useAllCollection } from './query';

interface CollectionMultiSelectProps extends Omit<ComponentProps<'div'>, 'name' | 'onChange' | 'onBlur' | 'value'> {
  disabled?: boolean;
  onChange: (newValue: number[] | null | undefined) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | null | undefined;
  ref: Ref<HTMLDivElement | null>;
}

export default function CollectionMultiSelect({
  onChange,
  value,
  disabled = false,
  className,
  ref,
  ...props
}: CollectionMultiSelectProps) {
  const { value: snapshot, fetchData } = useAllCollection();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => element, [element]);
  return (
    <div {...props} ref={setElement} className={cn('flex items-center', className)}>
      {snapshot.tag === CollectionLoadingState.loading && <Spinner />}
      {snapshot.tag === CollectionLoadingState.error && <RequestNotice error={snapshot.value} retry={fetchData} />}
      {snapshot.tag === CollectionLoadingState.state && (
        <CollectionMultiSelectView
          allCollections={snapshot.value}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
