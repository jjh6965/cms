import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import common from './utils/common';
import "bootstrap/dist/css/bootstrap.css"; // 부트스트랩 CSS 먼저 로드
import "bootstrap-icons/font/bootstrap-icons.css"; // 부트스트랩 아이콘 CSS 로드
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // 로컬 부트스트랩 JavaScript 로드
import './index.css'; // index.css는 부트스트랩 이후 로드
import { useLocation } from 'react-router-dom';

const Main = () => {
  const location = useLocation();

  useEffect(() => {
    const isMobileRoute = location.pathname.startsWith('/mobile/');
    const cssLink = document.getElementById('dynamic-css');

    if (isMobileRoute && !document.getElementById('globalMobile-css')) {
      const mobileLink = document.createElement('link');
      mobileLink.id = 'globalMobile-css';
      mobileLink.rel = 'stylesheet';
      mobileLink.href = './assets/css/globalMobile.css';
      document.head.appendChild(mobileLink);

      // global.css 제거
      if (cssLink) cssLink.remove();
    } else if (!isMobileRoute && !document.getElementById('global-css')) {
      const globalLink = document.createElement('link');
      globalLink.id = 'global-css';
      globalLink.rel = 'stylesheet';
      globalLink.href = '/assets/css/global.css'; 
      document.head.appendChild(globalLink);

      // globalMobile.css 제거
      if (cssLink) cssLink.remove();
    }
  }, [location]);

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter
    basename={common.getBaseName()}
    future={{
      v7_startTransition: true,
    }}
  >
    <Main />
  </BrowserRouter>
);