import Edit, { EditProps } from 'edit';

export interface CustomEditProps extends Omit<EditProps, 'code' | 'onChangeCode'> {
  onChange: (newValue: string) => void;
  value: string;
}
export default function CustomEdit({ value, onChange, ...props }: CustomEditProps): JSX.Element {
  return <Edit code={value} onChangeCode={onChange} {...props} />;
}
