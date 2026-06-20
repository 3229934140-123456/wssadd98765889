import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { AppProvider } from './store/AppContext';
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] 小程序初始化完成');
  }, []);

  useDidShow(() => {
    console.log('[App] 小程序显示');
  });

  useDidHide(() => {
    console.log('[App] 小程序隐藏');
  });

  return (
    <AppProvider>
      {props.children}
    </AppProvider>
  );
}

export default App;
