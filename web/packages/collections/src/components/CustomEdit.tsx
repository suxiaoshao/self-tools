import Edit, { EditProps } from 'edit';

export interface CustomEditProps extends Omit<EditProps, 'code' | 'onChangeCode'> {
  onChange: (event: { target: { value: string } }, newValue: string) => void;
  value: string;
}
export default function CustomEdit({ value, onChange, ...props }: CustomEditProps): JSX.Element {
  return <Edit code={value} onChangeCode={(value) => onChange({ target: { value } }, value)} {...props} />;
}
