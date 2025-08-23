/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2023-07-10 16:34:52
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 07:27:12
 * @FilePath: /tauri/Users/weijie.su/Documents/code/self/self-tools/web/common/edit/src/init.ts
 */
import { editor } from 'monaco-editor';
import './index.css';
import monankai from 'monaco-themes/themes/Dracula.json';

editor.defineTheme('monankai', monankai as editor.IStandaloneThemeData);
