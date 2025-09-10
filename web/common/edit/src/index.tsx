import { type Ref, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { editor } from 'monaco-editor';
import './init';
import { Box, type BoxProps, useTheme } from '@mui/material';
import { match } from 'ts-pattern';

export type MonacoEditorRef = editor.IStandaloneCodeEditor | undefined;

/**
 * @author sushao
 * @version 0.2.2
 * @since 0.2.2
 * @description 可写情况下的 editProp
 * */
export interface EditProps extends Omit<BoxProps, 'onChange'> {
  /**
   * 要显示的代码字符串
   * */
  code?: string;

  /**
   * 当编辑器代码改变时触发的方法
   * */
  onChangeCode?: (newCode: string) => void;
  language?: string;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  ref?: Ref<editor.IStandaloneCodeEditor | undefined>;
}

/**
 * @author sushao
 * @version 0.2.2
 * @since 0.2.2
 * @description 编辑器组件
 * */
export default function Edit({ onChangeCode, code, language, wordWrap, ref, ...props }: EditProps) {
  /**
   * 编辑器绑定的 dom 的引用
   * */
  const [editRef, setEditRef] = useState<HTMLDivElement | undefined>();
  /**
   * 编辑器实体
   * */
  const [edit, setEdit] = useState<editor.IStandaloneCodeEditor | undefined>();
  useImperativeHandle(ref, () => edit, [edit]);

  const theme = useTheme();
  const editTheme = useMemo(
    () =>
      match(theme.palette.mode)
        .with('dark', () => 'monankai')
        // eslint-disable-next-line no-useless-undefined
        .otherwise(() => undefined),
    [theme.palette.mode],
  );
  const createEditor = useCallback(() => {
    if (editRef === undefined) {
      return null;
    }
    if (
      (edit === undefined && editRef.firstChild === null) ||
      (edit !== undefined && edit?.getModel()?.getLanguageId() && edit?.getModel()?.getLanguageId() !== language)
    ) {
      const newEditor = editor.create(editRef, {
        theme: editTheme,
        automaticLayout: true,
        fontSize: 16,
        minimap: {
          enabled: true,
        },
        language,
        value: code,
        fontLigatures: true,
        wordWrap,
        fontFamily: 'jetbrains mono',
      });
      return newEditor;
    }
    return null;
  }, [code, edit, editRef, editTheme, language, wordWrap]);
  /**
   * 编辑器要绑定的 dom 生成时,再这个 dom 上新建一个编辑器,并赋值给 edit
   * */
  useEffect(() => {
    const newEdit = createEditor();
    if (newEdit !== null) {
      setEdit(newEdit);
    }
  }, [createEditor]);
  /**
   * props.readonly 改变时修改编辑器的只读属性
   * */
  useEffect(() => {
    const id = edit?.getModel()?.onDidChangeContent(() => {
      const content = edit?.getValue();
      if (content) {
        onChangeCode?.(content);
      }
    });
    return () => {
      id?.dispose();
    };
  }, [edit, onChangeCode]);

  /**
   * props.code 改变时,如果 props.code和编辑器本身储存的 code 不一样,则重设编辑器的值
   * */
  useEffect(() => {
    if (code !== edit?.getValue() && code) {
      edit?.setValue(code);
    }
  }, [edit, code]);
  /**
   * 编辑器退出时,使用 editor 的方法注销编辑器
   * */
  useEffect(() => {
    return () => {
      edit?.dispose();
    };
  }, [edit]);
  return <Box ref={setEditRef} {...props} />;
}
