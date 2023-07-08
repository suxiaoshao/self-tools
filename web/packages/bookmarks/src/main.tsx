import { reactBridge } from '@garfish/bridge-react-v18';
import App from './App';
import Error from '@bookmarks/components/Error';

export const provider = reactBridge({
  // 根组件, bridge 会默认传递 basename、dom、props 等信息到根组件
  rootComponent: App,
  // 设置应用的 errorBoundary
  errorBoundary: () => <Error />,
  el: '#root',
});
