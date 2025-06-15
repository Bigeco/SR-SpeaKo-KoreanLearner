// 라우팅 설정: 다른 URL로 이동할 때마다 다른 화면 전환해주기 위한 초기 설정
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import OnboardingView from '../pages/onboarding-view';
import StartRecordView from '../pages/start-record-view';
import OralStructureView from '../pages/oral-structure-view';
import ReelsView from '../pages/reels-view';

const router = createBrowserRouter([
  {
    path: "/",  // 기본 경로를 온보딩 화면으로 변경
    element: React.createElement(OnboardingView),
  },
  {
    path: "/start-record",
    element: React.createElement(StartRecordView),
  },
  {
    path: "/oral-structure",
    element: React.createElement(OralStructureView),
  },
  {
    path: "/reels",
    element: React.createElement(ReelsView),
  }
]);

export default router;
