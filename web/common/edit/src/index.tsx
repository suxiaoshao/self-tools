import { lazy, useCallback, useImperativeHandle, useRef, type Ref } from 'react';
import { AsyncBoundary } from 'ui/async-boundary';
import { Textarea } from 'ui/components/textarea';
import type { EditProps, MonacoEditorRef } from './types';
export type { EditProps, MonacoEditorRef } from './types';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

export default function Edit({ ref, focusRef, ...props }: EditProps & { focusRef?: Ref<{ focus: () => void }> }) {
  const editorRef = useRef<MonacoEditorRef>(undefined);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const pendingFocus = useRef(false);
  useImperativeHandle(
    focusRef,
    () => ({
      focus() {
        if (editorRef.current) editorRef.current.focus();
        else {
          pendingFocus.current = true;
          textarea.current?.focus();
        }
      },
    }),
    [],
  );
  const attach = useCallback(
    (instance: MonacoEditorRef | null) => {
      editorRef.current = instance ?? undefined;
      if (typeof ref === 'function') ref(instance);
      else if (ref) ref.current = instance ?? undefined;
      if (instance && pendingFocus.current) {
        pendingFocus.current = false;
        instance.focus();
      }
    },
    [ref],
  );
  const { code, onChangeCode, readOnly, language: _language, wordWrap: _wordWrap, ...containerProps } = props;
  const fallback = (
    <div {...containerProps}>
      <Textarea
        ref={textarea}
        className="size-full min-h-40 resize-none font-mono"
        aria-label={props['aria-label']}
        aria-describedby={props['aria-describedby']}
        aria-invalid={props['aria-invalid']}
        value={code ?? ''}
        readOnly={readOnly}
        onChange={(event) => onChangeCode?.(event.target.value)}
        onFocus={() => {
          pendingFocus.current = true;
        }}
        onBlur={() => {
          pendingFocus.current = false;
        }}
      />
    </div>
  );
  return (
    <AsyncBoundary pending={fallback} failed={fallback}>
      <MonacoEditor {...props} ref={attach} />
    </AsyncBoundary>
  );
}
