import type { ComponentProps, Ref } from 'react';
import type { editor } from 'monaco-editor';

export type MonacoEditorRef = editor.IStandaloneCodeEditor | undefined;

/**
 * @author sushao
 * @version 0.2.2
 * @since 0.2.2
 * @description 可写情况下的 editProp
 * */
export interface EditProps extends Omit<ComponentProps<'div'>, 'onChange' | 'code' | 'ref'> {
  /**
   * 要显示的代码字符串
   * */
  code?: string;

  /**
   * 当编辑器代码改变时触发的方法
   * */
  onChangeCode?: (newCode: string) => void;
  readOnly?: boolean;
  language?: string;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  ref?: Ref<editor.IStandaloneCodeEditor | undefined>;
}
