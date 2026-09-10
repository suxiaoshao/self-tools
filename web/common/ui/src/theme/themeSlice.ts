import { create } from 'zustand';

export enum ColorSetting {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

export const useColorStore = create<{ color: string; updateColor: (color: string) => void }>((set) => ({
  color: window.localStorage.getItem('color') ?? '#9cd67e',
  updateColor: (color) => {
    window.localStorage.setItem('color', color);
    set({ color });
  },
}));
