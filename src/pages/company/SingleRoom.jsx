import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import img14 from "../../assets/images/1-room.jpg";
import "../company/SingleRoom.css";

const SingleRoom = () => {
  return (
    <div>
      <div className="about-1-room">
        <div className="about-content">
          <div className="RoomMainTitle">1인실</div>
          <div className="img-container-1">
            <img src={img14} alt="1인실" />
          </div>
          <div className="info-text-content-1">
            <div className="RoomMainTitle">시설 안내</div>
            <div className="room1-details">
              <p>
                <FontAwesomeIcon icon={faCheck} /> 개인 전용 책상, 의자, 서랍장, 블라인드
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 스프링클러, 화재감지기 등 소방안전시설
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 무료 주차 1대 지원
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 월 이용료 외 별도 관리비 부담 제로
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 초고속 유무선 인터넷 (개인 전용 라인 옵션 제공)
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 24시간 냉난방시스템 제공
              </p>
              <p>
                <FontAwesomeIcon icon={faCheck} /> 개인 맞춤형 조명 및 소음 차단 설비
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SingleRoom;
