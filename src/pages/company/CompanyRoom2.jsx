  import { Link } from "react-router-dom";
import Company from "./Share";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import "../company/CompanyRoom2.css";
import img15 from "../../assets/images/2-room.jpg";

export default function Room2() {
  return (
    <div className="section">
      <div className="logo">
        <Company paths={[{ label: "시설 안내" }, { label: "2인실" }]} />
      </div>
      <div className="about-2-room">
        <div className="sidebar">
          <div className="square">
            <div className="RoomSideTitle">시설 안내</div>
          </div>
          <div className="mini-square">
            <Link to="/company/CompanyRoom1">1인실</Link>
          </div>
          <div className="mini-square2">
            <Link to="/company/CompanyRoom2">2인실</Link>
          </div>
          <div className="mini-square3">
            <Link to="/company/CompanyRoom4">4인실</Link>
          </div>
          <div className="mini-square4">
            <Link to="/company/CompanyRoom8">8인실</Link>
          </div>
        </div>
        <div className="about-content">
          <div className="RoomMainTitle">2인실</div>
          <div className="img-container-2">
            <img src={img15} alt="2인실" />
          </div>
          <div className="info-text-content-2">
            <div className="RoomMainTitle">시설 안내</div>
            <div className="room2-details">
              <p>
                <FontAwesomeIcon icon={faCheck} /> 책상, 의자, 서랍장, 블라인드
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 스프링클러, 화재감지기등
                소방안전시설
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 주차시설 무료지원
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 월 이용료 외 별도 관리비 부담
                제로
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 초고속 유무선 인터넷
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 24시간 냉난방시스템 제공
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 회의실, 카페라운지, 우편함등
                다양한 서비스 제공
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
