import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import img17 from "../../assets/images/8-room.jpg";
import "../company/OctaRoom.css";

const OctaRoom = () => {
    return (
        <div>
<div className="about-4-room">
        <div className="about-content">
          <div className="RoomMainTitle">8인실</div>
          <div className="img-container-4">
            <img src={img17} alt="8인실" />
          </div>
          <div className="info-text-content-4">
            <div className="RoomMainTitle">시설 안내</div>
            <div className="room4-details">
                  <p><FontAwesomeIcon icon={faCheck} /> 8인용 대형 테이블 및 의자, 공용 서랍장, 블라인드</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 스프링클러, 화재감지기 등 소방안전시설</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 무료 주차 8대 지원</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 월 이용료 외 별도 관리비 부담 제로</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 초고속 유무선 인터넷 (공용 라인)</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 24시간 냉난방시스템 제공</p>
                  <p><FontAwesomeIcon icon={faCheck} /> 대형 회의실 4시간 무료 이용권 및 팀 전용 라운지 제공</p>
            </div>
          </div>
        </div>
      </div>
        </div>
    )
}
export default OctaRoom;