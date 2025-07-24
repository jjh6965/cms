import React, { useEffect, useState, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import MainHeader from './MainHeader';
import MainTopNav from './MainTopNav';
import MainTopNavLoc from './MainTopNavLoc';
import MainFooter from './MainFooter';
import useStore from '../../store/store';
import { fetchData } from '../../utils/dataUtils';
import { hasPermission, checkTokenValiditySimple } from '../../utils/authUtils';
import common from '../../utils/common';
import api from '../../utils/api.js';
import styles from './MainLayout.module.css';
import logo from '../../assets/images/logo.png';
import menuData from '../../data/menu.json';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser, setMenu, menu } = useStore();
  const [isChecking, setIsChecking] = useState(true);

  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(p => p);
    const breadcrumb = [{ name: 'Home', path: '/main' }];
    let currentPath = '/main';
    path.forEach(seg => {
      currentPath += `/${seg}`;
      const menuItem = menuData.find(m => m.URL === currentPath || m.children?.some(c => c.URL === currentPath));
      if (menuItem) {
        breadcrumb.push({ name: menuItem.MENUNM, path: currentPath, isLast: seg === path[path.length - 1] });
      } else {
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        const parentMenu = menuData.find(m => m.children?.some(c => c.URL === currentPath));
        if (parentMenu) breadcrumb.push({ name: parentMenu.MENUNM, path: parentPath, isLast: false });
      }
    });
    return breadcrumb;
  };

  const handleLogoClick = async (e) => {
    e.preventDefault();
    if (!hasPermission(user?.auth, 'main')) {
      console.warn('Permission denied for main');
      navigate('/', { replace: true });
      return;
    }
    const isValid = await checkTokenValiditySimple(clearUser);
    if (!isValid) navigate('/', { replace: true });
    navigate('/main');
  };

  useEffect(() => {
    const fetchMenu = async () => {
      if (menu) return;
      try {
        const response = await fetchData(api, common.getServerUrl('auth/menu'), { userId: user.empNo });
        if (response.success && response.data && response.data.length > 0) setMenu(response.data);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      }
    };
    fetchMenu();
  }, [setMenu, menu, user]);

  useEffect(() => {
    const verifyUser = async () => {
      const isValid = await checkTokenValiditySimple(clearUser);
      if (!isValid && user) navigate('/', { replace: true });
      setIsChecking(false);
    };
    verifyUser();
  }, [user, navigate, clearUser]);

  useEffect(() => {
    const handleClick = async (e) => {
      const isValid = await checkTokenValiditySimple(clearUser);
      if (!isValid) {
        e.preventDefault();
        navigate('/', { replace: true });
        return;
      }
      if (e.target.classList.contains(styles.scrolly)) {
        const scrollTarget = e.target.getAttribute('data-scroll-target');
        const path = e.target.getAttribute('data-path');
        const screen = path ? path.split('/').filter(Boolean).pop() : '';
        if (screen && !hasPermission(user?.auth, screen)) {
          console.warn(`Permission denied for ${screen}`);
          e.preventDefault();
          return;
        }
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        if (scrollTarget) {
          const target = document.querySelector(scrollTarget);
          if (target) {
            const navHeight = document.querySelector(`#${styles.nav}`)?.offsetHeight || 0;
            window.scrollTo({ top: target.offsetTop - navHeight - 5, behavior: 'smooth' });
          }
        }
      }
    };
    const nav = document.querySelector(`#${styles.nav}`);
    const navLogo = document.querySelector(`#${styles.logo}`);
    if (nav) nav.addEventListener('click', handleClick);
    if (navLogo) navLogo.addEventListener('click', handleLogoClick);
    return () => {
      if (nav) nav.removeEventListener('click', handleClick);
      if (navLogo) navLogo.removeEventListener('click', handleLogoClick);
    };
  }, [navigate, user, clearUser]);

  if (isChecking || !user) return <div>Loading...</div>;

  return (
    <div>
      <header id="header" className={styles.header}>
        <div className={styles.logo} onClick={handleLogoClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleLogoClick(e)}>
          <img src={logo} alt="Logo" className={styles.logoImage} />
        </div>
        <div className={styles.headerNavGroup}>
          <MainHeader />
          <div className={styles.headerNav}>
            <nav className={styles.nav}>
              <MainTopNav menuData={menuData} onNavigate={navigate} />
            </nav>
          </div>
        </div>
      </header>
      <div>
        <MainTopNavLoc />
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {getBreadcrumb().map((item, index) => (
              <li key={index} className={`breadcrumb-item ${item.isLast ? 'active' : ''}`}>
                {item.isLast ? item.name : <a href={item.path}>{item.name}</a>}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <section className={styles.main}>
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </section>
      <footer id="footer">
        <MainFooter />
      </footer>
    </div>
  );
};

export default MainLayout;