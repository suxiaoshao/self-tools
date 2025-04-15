import Edit, { type EditProps } from 'edit';

export interface CustomEditProps extends Omit<EditProps, 'code' | 'onChangeCode'> {
  onChange: (newValue: string) => void;
  value: string;
}
export default function CustomEdit({ value, onChange, ...props }: CustomEditProps) {
  return <Edit code={value} onChangeCode={onChange} {...props} />;
}
