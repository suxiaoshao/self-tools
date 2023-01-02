import 'monaco-editor/esm/vs/editor/editor.main';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import { editor } from 'monaco-editor';
import monankai from 'monaco-themes/themes/Dracula.json';

self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    if (label === 'json') return new JsonWorker();
    if (label === 'css') return new CssWorker();
    if (label === 'html') return new HtmlWorker();
    return new EditorWorker();
  },
};
editor.defineTheme('monankai', monankai as editor.IStandaloneThemeData);
