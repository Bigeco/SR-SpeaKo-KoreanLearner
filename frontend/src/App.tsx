import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';

interface RouteLink {
  path: string;
  name: string;
  description: string;
}

const App: React.FC = () => {
  // 앱의 주요 경로
  const routes: RouteLink[] = [
    {
      path: '/onboarding',
      name: '온보딩 화면',
      description: '앱 소개 및 시작 화면'
    },
    {
      path: '/subtitle',
      name: '자막 화면',
      description: '발음 연습 및 피드백'
    },
    {
      path: '/start-record',
      name: '녹음 시작 화면',
      description: '녹음 기능 시작 화면'
    },
    {
      path: '/oral-structure',
      name: '구강 구조 화면',
      description: '발음 구조 학습'
    },
    {
      path: '/progress',
      name: '진행도 화면',
      description: '학습 진행 상황 확인'
    },
    {
      path: '/reels',
      name: '릴스 화면',
      description: '쇼츠 형식의 학습 콘텐츠'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">발음 학습 앱</h1>
        <p className="text-gray-600">원하는 화면을 선택하세요(임시)</p>
      </header>
      
      <div className="w-full max-w-md grid gap-4">
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className="block bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-blue-600">{route.name}</h2>
            <p className="text-gray-600 mt-1">{route.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default App;