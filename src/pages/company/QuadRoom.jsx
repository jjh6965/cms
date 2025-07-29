import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import img16 from "../../assets/images/4-room.jpg";
import "../company/QuadRoom.css";

const QuadRoom = () => {
    return (
        <div>
<div className="about-3-room">
        <div className="about-content">
          <div className="RoomMainTitle">4인실</div>
          <div className="img-container-3">
            <img src={img16} alt="4인실" />
          </div>
          <div className="info-text-content-3">
            <div className="RoomMainTitle">시설 안내</div>
            <div className="room3-details">
                  <p><FontAwesomeIcon icon={faCheck} /> 4인용 테이블 및 의자, 공용 서랍장, 블라인드</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 스프링클러, 화재감지기 등 소방안전시설</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 무료 주차 4대 지원</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 월 이용료 외 별도 관리비 부담 제로</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 초고속 유무선 인터넷 (공용 라인)</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 24시간 냉난방시스템 제공</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 대형 회의실 2시간 무료 이용권</p>
            </div>
          </div>
        </div>
      </div>
        </div>
    )
}
export default QuadRoom;