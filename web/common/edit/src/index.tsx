import { useCallback, useEffect, useRef, useState } from 'react';
import './init';
import { editor } from 'monaco-editor';
import { Box, BoxProps, useTheme } from '@mui/material';
import { MonacoMarkdownExtension } from 'monaco-markdown';

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
  onChangeCode?(newCode: string): void;
  language?: string;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
}

/**
 * @author sushao
 * @version 0.2.2
 * @since 0.2.2
 * @description 编辑器组件
 * */
export default function Edit({ onChangeCode, code, language, wordWrap, ...props }: EditProps): JSX.Element {
  /**
   * 编辑器绑定的 dom 的引用
   * */
  const editRef = useRef<HTMLDivElement>(null);
  const createTimes = useRef(0);
  /**
   * 编辑器实体
   * */
  const [edit, setEdit] = useState<editor.IStandaloneCodeEditor | null>(null);

  const theme = useTheme();
  const createEdtior = useCallback(
    (html: HTMLElement) => {
      if (createTimes.current === 0) {
        const newEditor = editor.create(html, {
          theme: theme.palette.mode === 'dark' ? 'monankai' : undefined,
          automaticLayout: true,
          fontSize: 16,
          minimap: {
            enabled: true,
          },
          language,
          value: code,
          fontLigatures: true,
          wordWrap,
        });
        if (language === 'markdown') {
          const extension = new MonacoMarkdownExtension();
          extension.activate(newEditor as Parameters<typeof extension.activate>[0]);
        }
        createTimes.current++;
        return newEditor;
      } else {
        return null;
      }
    },
    [code, language, theme.palette.mode, wordWrap],
  );
  /**
   * 编辑器要绑定的 dom 生成时,再这个 dom 上新建一个编辑器,并赋值给 edit
   * */
  useEffect(() => {
    if (editRef.current !== null && edit === null) {
      const newEdit = createEdtior(editRef.current);
      if (newEdit !== null) {
        setEdit(newEdit);
      }
    }
  }, [createEdtior, edit]);
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
  return <Box ref={editRef} {...props} />;
}