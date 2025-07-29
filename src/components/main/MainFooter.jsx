import React from 'react';
import styles from './MainLayout.module.css';

const MainFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerMenu}>
          <p>&copy; 2025 All rights reserved.</p>
          <p>공유 오피스 대표: 정재훈</p>
          <p>경기도 수원시 장안구 정조로 940-1(영화동, 연세IT미래교육원 빌딩)</p>
          <p>고객센터: 031-250-2662</p>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;