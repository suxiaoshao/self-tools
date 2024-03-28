/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 00:35:51
 * @FilePath: /self-tools/web/common/types/src/micro.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ThemeOptions } from '@mui/material';
import { Enum } from './enum';
import { ReactNode } from 'react';

export interface MicroState {
  theme: MicroTheme;
  lang: string;
}

export type MicroTheme = Pick<ThemeOptions, 'palette'>;

export interface PathItem {
  path: string;
  element?: React.ReactNode;
  children?: ReactNode;
}

export type Menu = { name: string; path: Enum<'path', PathItem> | Enum<'menu', Menu[]>; icon: string };

export interface MicroConfig {
  getName(): string;
  getIcon(): string;
  getActiveRule(): string;
  getMenu(): Menu[];
  getElement(): React.ReactNode;
}
