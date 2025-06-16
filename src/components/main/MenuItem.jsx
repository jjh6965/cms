import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import common from '../../utils/common';
import useStore from '../../store/store';
import { checkTokenValidity, hasPermission } from '../../utils/authUtils'; // Import from authUtils
import styles from './MainLayout.module.css';

const MenuItem = ({ item }) => {
  const [showChildren, setShowChildren] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useStore();
  const basename = common.getBaseName();

  const normalizedPath = location.pathname.startsWith(basename)
    ? location.pathname.replace(basename, '')
    : location.pathname;

  const hasValidPath = item.URL && item.URL.trim() !== '';
  const hasChildren = item.children && item.children.length > 0 && item.children.some(child => child.URL || child.children?.length > 0);

  const isCurrent =
    hasValidPath &&
    normalizedPath === item.URL &&
    !(item.URL === '/main' && normalizedPath !== '/main');

  // Extract screen name from URL (e.g., '/main/board' -> 'mainBoard')
  const getScreenName = (url) => {
    if (!url) return '';
    const segments = url.split('/').filter(Boolean);
    return segments[segments.length - 1] || segments[0] || '';
  };

  // NavLink 클릭 시 토큰 검증 및 권한 확인 후 이동
  const handleNavClick = async (e) => {
    e.preventDefault();
    const screen = getScreenName(item.URL);
    
    // Check permission
    if (!hasPermission(user?.auth, screen)) {
      console.warn(`Permission denied for ${screen}`);
      return;
    }

    // Check token validity
    const isValid = await checkTokenValidity(navigate, user, setUser, clearUser);
    if (isValid && hasValidPath) {
      navigate(item.URL);
    }
  };

  const toggleChildren = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setShowChildren(!showChildren);
    }
  };

  return (
    <li
      className={`${styles.menuItem} ${hasChildren ? styles.menu : ''} ${isCurrent ? styles.current : ''}`}
      onMouseEnter={() => hasChildren && setShowChildren(true)}
      onMouseLeave={() => hasChildren && setShowChildren(false)}
    >
      {hasChildren ? (
        <>
          <a
            href="#"
            className={`${styles.menuLink} ${styles.scrolly}`}
            onClick={toggleChildren}
            data-path={item.URL}
          >
            {item.MENUNM}
          </a>
          <ul className={`${styles.subMenu} ${showChildren ? styles.visible : ''}`}>
            {item.children
              .filter(child => child.URL || (child.children && child.children.length > 0))
              .map((child) => (
                <MenuItem key={child.MENUID} item={child} />
              ))}
          </ul>
        </>
      ) : hasValidPath ? (
        <NavLink
          to={item.URL}
          className={({ isActive }) =>
            `${styles.navLink} ${styles.scrolly} ${isActive ? styles.active : ''}`
          }
          data-path={item.URL}
          end={item.URL === '/main'}
          onClick={handleNavClick} // 클릭 시 토큰 검증 및 권한 확인
        >
          {item.MENUNM}
        </NavLink>
      ) : (
        <span className={`${styles.menuLink} ${styles.scrolly}`}>
          {item.MENUNM}
        </span>
      )}
    </li>
  );
};

export default MenuItem;