import "../company/SideMenu.css";

const SideMenu = ({ onMenuClick }) => {
  return (
    <div className="side-sticky">
      <div
        className="side-menu"
        onClick={() => onMenuClick("info")}
      >
        공간 소개
      </div>
      <div
        className="side-menu"
        onClick={() => onMenuClick("facility")}
      >
        편의 시설
      </div>
      <div
        className="side-menu"
        onClick={() => onMenuClick("caution")}
      >
        주의 사항
      </div>
      <div
        className="side-menu"
        onClick={() => onMenuClick("reservation")}
      >
        예약 안내
      </div>
      <div
        className="side-menu"
        onClick={() => onMenuClick("location")}
      >
        위치
      </div>
    </div>
  );
};

export default SideMenu;