import Edit, { type EditProps } from './index';
import { useImperativeHandle, useRef, type Ref } from 'react';

interface CustomEditRef {
  focus: () => void;
  value: string;
}
interface CustomEditProps extends Omit<EditProps, 'code' | 'onChangeCode' | 'ref'> {
  onChange: (newValue: string) => void;
  value: string;
  ref?: Ref<CustomEditRef>;
}
export default function CustomEdit({ value, onChange, ref, ...props }: CustomEditProps) {
  const focusRef = useRef<{ focus: () => void }>(null);
  useImperativeHandle(ref, () => ({ focus: () => focusRef.current?.focus(), value }), [value]);
  return <Edit code={value} onChangeCode={onChange} focusRef={focusRef} {...props} />;
}
