import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react';
import { editor } from 'monaco-editor';
import './init';
import { useTheme } from 'ui/theme';
import type { EditProps } from './types';

export default function MonacoEditor({
  code = '',
  onChangeCode,
  language,
  wordWrap,
  readOnly = false,
  ref,
  'aria-label': ariaLabel,
  ...props
}: EditProps) {
  const container = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<editor.IStandaloneCodeEditor>();
  const { resolvedTheme: theme } = useTheme();
  const onChange = useEffectEvent((value: string) => onChangeCode?.(value));
  const initialOptions = useEffectEvent(() => ({ value: code, language, readOnly, wordWrap, ariaLabel }));
  useImperativeHandle(ref, () => instance, [instance]);
  useEffect(() => {
    if (!container.current) return;
    const edit = editor.create(container.current, {
      ...initialOptions(),
      automaticLayout: true,
      fontSize: 16,
      fontLigatures: true,
      minimap: { enabled: true },
      fontFamily: 'jetbrains mono',
    });
    const model = edit.getModel();
    const subscription = edit.onDidChangeModelContent(() => onChange(edit.getValue()));
    setInstance(edit);
    return () => {
      subscription.dispose();
      edit.dispose();
      model?.dispose();
    };
  }, []);
  useEffect(() => {
    instance?.updateOptions({ readOnly, ariaLabel, wordWrap });
  }, [instance, readOnly, ariaLabel, wordWrap]);
  useEffect(() => {
    if (instance && code !== instance.getValue()) instance.setValue(code);
  }, [instance, code]);
  useEffect(() => {
    const model = instance?.getModel();
    if (model) editor.setModelLanguage(model, language ?? 'plaintext');
  }, [instance, language]);
  useEffect(() => {
    editor.setTheme(theme === 'dark' ? 'monankai' : 'vs');
  }, [theme]);
  return <div ref={container} {...props} />;
}
