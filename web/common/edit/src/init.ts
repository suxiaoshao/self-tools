import 'monaco-editor/esm/vs/editor/editor.main';
import { editor } from 'monaco-editor';
import monankai from 'monaco-themes/themes/Dracula.json';

// const JsonWorker = new Worker('monaco-editor/esm/vs/language/json/json.worker', { type: 'module' });
// const CssWorker = new Worker('monaco-editor/esm/vs/language/css/css.worker', { type: 'module' });
// const HtmlWorker = new Worker('monaco-editor/esm/vs/language/html/html.worker', { type: 'module' });
// const EditorWorker = new Worker('monaco-editor/esm/vs/editor/editor.worker', { type: 'module' });
// const TsWorker = new Worker('monaco-editor/esm/vs/language/typescript/ts.worker', { type: 'module' });
// self.MonacoEnvironment = {
//   getWorker(_: string, label: string) {
//     if (label === 'typescript' || label === 'javascript') return TsWorker;
//     if (label === 'json') return JsonWorker;
//     if (label === 'css') return CssWorker;
//     if (label === 'html') return HtmlWorker;
//     return EditorWorker;
//   },
// };
editor.defineTheme('monankai', monankai as editor.IStandaloneThemeData);
