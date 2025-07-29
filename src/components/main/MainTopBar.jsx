import MainHeader from "./MainHeader";
import MainTopNav from "./MainTopNav";
import styles from "./MainLayout.module.css";

const MainTopBar = () => {
    return (
        <div className={styles.topBarContainer}>
         <div className={styles.center}><MainTopNav /></div>
            <div className={styles.right}><MainHeader /></div>
        </div>
    );
}
export default MainTopBar;