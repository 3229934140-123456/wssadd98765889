import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { AppProvider, useApp } from './store/AppContext';
import './app.scss';

function AppContent({ children }: { children: React.ReactNode }) {
  const { profile } = useApp();

  useEffect(() => {
    if (!profile.onboardingCompleted) {
      console.log('[App] 检测到未完成引导，跳转到引导页');
      Taro.redirectTo({
        url: '/pages/onboarding/index',
      }).catch(err => {
        console.error('[App] 跳转引导页失败:', err);
      });
    }
  }, [profile.onboardingCompleted]);

  return <>{children}</>;
}

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
      <AppContent>{props.children}</AppContent>
    </AppProvider>
  );
}

export default App;
