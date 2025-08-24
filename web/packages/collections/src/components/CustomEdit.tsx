import { proxy } from '@bookmarks/utils/proxy';
import Edit, { type EditProps, type MonacoEditorRef } from 'edit';
import { useImperativeHandle, useState, type Ref } from 'react';

export interface CustomEditRef {
  focus: () => void;
  value: string;
}

export interface CustomEditProps extends Omit<EditProps, 'code' | 'onChangeCode' | 'ref'> {
  onChange: (newValue: string) => void;
  value: string;
  ref?: Ref<CustomEditRef>;
}
export default function CustomEdit({ value, onChange, ref, ...props }: CustomEditProps) {
  const [editRef, setEditRef] = useState<MonacoEditorRef | null>();
  useImperativeHandle(
    ref,
    () =>
      proxy({
        focus: () => {
          editRef?.focus();
        },
        value,
      }),
    [value, editRef],
  );
  return <Edit code={value} onChangeCode={onChange} ref={setEditRef} {...props} />;
}
