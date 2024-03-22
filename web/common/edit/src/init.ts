/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2023-07-10 16:34:52
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-20 17:19:44
 * @FilePath: /tauri/Users/weijie.su/Documents/code/self/self-tools/web/common/edit/src/init.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { editor } from 'monaco-editor';
import monankai from 'monaco-themes/themes/Dracula.json';

editor.defineTheme('monankai', monankai as editor.IStandaloneThemeData);
