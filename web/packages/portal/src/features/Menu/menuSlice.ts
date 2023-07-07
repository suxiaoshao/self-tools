import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Menu } from '../../micro/config';
import { RootState } from '../../app/store';

export type MenuItem = { menu: Menu; parentsPath: string };

export interface MenuSliceType {
  value: MenuItem[];
}

export const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    value: [],
  } as MenuSliceType,
  reducers: {
    setMenu: (state, action: PayloadAction<MenuItem[]>) => {
      state.value = action.payload;
    },
  },
});

export const { setMenu } = menuSlice.actions;

export const selectMenu = (state: RootState) => state.menu.value;

export default menuSlice.reducer;
