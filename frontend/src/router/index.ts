// 라우팅 설정: 다른 URL로 이동할 때마다 다른 화면 전환해주기 위한 초기 설정
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import OnboardingView from '../pages/onboarding-view';
import StartRecordView from '../pages/start-record-view';
import OralStructureView from '../pages/oral-structure-view';
import ProgressView from '../pages/progress-view';
import ReelsView from '../pages/reels-view';

const router = createBrowserRouter([
  {
    path: "/",  // 기본 경로 추가
    element: React.createElement(App),
  },
  {
    path: "/onboarding",
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
    path: "/progress",
    element: React.createElement(ProgressView),
  },
  {
    path: "/reels",
    element: React.createElement(ReelsView),
  }
]);

export default router;
