import Company from "./Share";
import "../company/CompanyUsing.css";
import { useState } from "react";
import Info from "./InfoSharedOffice";
import Facil from "./CompanyFacilities";
import Caut from "./CompanyCautionInfo";
import Reserv from "./CompanyPriceInfo";
import { useNavigate } from "react-router-dom";
import SingleRoom from "../company/SingleRoom";
import DoubleRoom from "../company/DoubleRoom";
import QuadRoom from "../company/QuadRoom";
import OctaRoom from "../company/OctaRoom";

const CompanyUsing = () => {
  const [view, setView] = useState("info");
  const navigate = useNavigate();
  const [tabFocus, setTabFocus] = useState("");

  // 사이드 메뉴 클릭 핸들러
  const handleSideClick = (newView) => {
    setView(newView);
    setTabFocus(newView);
    console.log("Current view:", newView);
  };

  // 서브탭 클릭 핸들러 
    const handleSubTabClick = (subTab) => {
    switch (subTab) {
      case "1인실":
        setView("singleRoom");
        break;
      case "2인실":
        setView("doubleRoom");
        break;
      case "4인실":
        setView("quadRoom"); // 3인실 요청이 없으므로 4인실로 대체 (필요 시 별도 컴포넌트 추가 가능)
        break;
      case "8인실":
        setView("octaRoom"); // 4인실 요청을 8인실로 대체 (의도 반영)
        break;
      default:
        setView("info");
    }
    setTabFocus("info"); // info 탭에 포커스 유지
  };

  // view 상태에 따라 렌더링할 콘텐츠 정의
  const renderContent = () => {
    switch (view) {
      case "info":
        return <Info />;
      case "facility":
        return <Facil />;
      case "caution":
        return <Caut />;
      case "reservation":
        return <Reserv />;
      case "singleRoom":
        return <SingleRoom />;
      case "doubleRoom":
        return <DoubleRoom />;
      case "quadRoom":
        return <QuadRoom />;
      case "octaRoom":
        return <OctaRoom />;
      case "location":
        return navigate("/company/CompanyDirections");
      default:
        return <div>Content Loading Error....</div>;
    }
  };

  return (
    <div className="section">
      <div className="nav-content-container">
        <div className="logo">
          <Company paths={[{ label: "이용 안내" }, { label: "공유 오피스 이용 안내" }]} />
        </div>
        <div className="about-using">{renderContent()}</div>
      </div>
      <div className="side-sticky">
        <div className="side-menu-info">
          <div className={`side-menu ${tabFocus === "info" ? "active" : ""}`} onClick={() => handleSideClick("info")}>
            공간 소개
          </div>
          <div className="info-sub">
            <div className="info-subtab" onClick={() => handleSubTabClick("1인실")}>1인실</div>
            <div className="info-subtab" onClick={() => handleSubTabClick("2인실")}>2인실</div>
            <div className="info-subtab" onClick={() => handleSubTabClick("4인실")}>4인실</div>
            <div className="info-subtab" onClick={() => handleSubTabClick("8인실")}>8인실</div>
          </div>
        </div>
        <div className={`side-menu ${tabFocus === "facility" ? "active" : ""}`} onClick={() => handleSideClick("facility")}>
          편의 시설
        </div>
        <div className={`side-menu ${tabFocus === "caution" ? "active" : ""}`} onClick={() => handleSideClick("caution")}>
          주의 사항
        </div>
        <div className={`side-menu ${tabFocus === "reservation" ? "active" : ""}`} onClick={() => handleSideClick("reservation")}>
          예약 안내
        </div>
        <div className="side-menu" onClick={() => handleSideClick("location")}>
          위치
        </div>
      </div>
    </div>
  );
};

export default CompanyUsing;