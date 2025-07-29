import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/store';
import { fetchData } from '../../utils/dataUtils';
import common from "../../utils/common";
import api from '../../utils/api';
import styles from './MainLayout.module.css';

const MainHeader = () => {
  const [logout, setLogout] = useState(false);
  const { user, clearUser, clearMenu } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLogout(true);
    try {
      await fetchData(api, common.getServerUrl('auth/logout'), {});
      clearUser();
      if (clearMenu) {
        clearMenu();
      } else {
        console.error('clearMenu is undefined');
      }
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
    }
  };

  const handleMyPage = () => {
    navigate('/myPage');
  };

  useEffect(() => {
    if (logout) {
      navigate('/', { replace: true });
    }
  }, [logout, navigate]);

  return (
    <div className={styles.headerTop}>
      <div className={styles.headerMenu}>
        {user && user.empNm ? (
          <>
            <ul>
              <li>{user.empNm} 님 안녕하세요.</li>
            </ul>
            <ul>
              <li onClick={handleMyPage} className={styles.extendLink}>
                마이페이지
              </li>
            </ul>
            <ul>
              <li onClick={handleLogout} className={styles.logoutLink}>
                로그아웃
              </li>
            </ul>
          </>
        ) : (
          <ul>
            <li>로그인해주세요.</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default MainHeader;