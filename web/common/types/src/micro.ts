/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 00:35:51
 * @FilePath: /self-tools/web/common/types/src/micro.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { ReactNode } from 'react';
import type { Enum } from './enum';

export interface MicroState {
  lang: string;
}

export interface PathItem {
  path: string;
  element?: ReactNode;
  children?: ReactNode;
}

export interface Menu {
  name: string;
  path: Enum<'path', PathItem> | Enum<'menu', Menu[]>;
  icon: string;
}

export interface MicroConfig {
  getName(): string;
  getIcon(): string;
  getActiveRule(): string;
  getMenu(): Menu[];
  getElement(): ReactNode;
}
