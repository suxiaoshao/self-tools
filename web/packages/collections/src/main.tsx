import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MicroState } from 'common';
import store from './app/store';
import { setTheme } from './app/features/themeSlice';
import { setLang } from './app/features/i18nSlice';

let root: ReactDOM.Root | null = null;

/**
 * bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
 * 通常我们可以在这里做一些全局变量的初始化，比如不会在 unmount 阶段被销毁的应用级别的缓存等。
 */
export async function bootstrap() {
  console.log('react app bootstrapped');
}

interface Props {
  state: MicroState;
  container?: HTMLElement;
  onGlobalStateChange: (callback: (state: MicroState, prev: MicroState) => void) => void;
}

/**
 * 应用每次进入都会调用 mount 方法，通常我们在这里触发应用的渲染方法
 */
export async function mount(props: Props) {
  console.log('react app mount', props);
  store.dispatch(setTheme(props.state.theme));
  store.dispatch(setLang(props.state.lang));
  props.onGlobalStateChange((state: MicroState) => {
    store.dispatch(setTheme(state.theme));
    store.dispatch(setLang(state.lang));
  });
  root = ReactDOM.createRoot(props.container ?? (document.getElementById('micro') as HTMLElement));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

/**
 * 应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
 */
export async function unmount() {
  root?.unmount();
}
