// 라우팅 설정: 다른 URL로 이동할 때마다 다른 화면 전환해주기 위한 초기 설정
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import SubtitleView from '../pages/subtitle-view';
import App from '../App';

const router = createBrowserRouter([
  {
    path: "/",  // 기본 경로 추가
    element: React.createElement(App),
  },
  {
    path: "/subtitle",
    element: React.createElement(SubtitleView),
  }
]);

export default router;
