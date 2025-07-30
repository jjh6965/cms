import img07 from "../../assets/images/Image_fx21.jpg";
import img08 from "../../assets/images/cafeteria.jpg";
import img09 from "../../assets/images/refrigerator.jpg";
import img10 from "../../assets/images/office.jpg";
import img11 from "../../assets/images/support.jpg";
import img12 from "../../assets/images/lockerRoom.jpg";

import "../company/InfoSharedOffice.css";

const InfoSharedOffice = () => {
  return (
    <div>
      <div className="about-content">
        <div className="UsingMainTitle1">편의 시설</div>
        <div className="ShareOffice-info">
          공유 오피스는 소규모부터 대규모까지 다양한 업무 공간을 유연하게 제공해 협업과 효율성을 높입니다. 저희 회사는 맞춤형 사무실 설계,
          최신 IT 인프라, 편리한 공용 시설을 통해 생산적인 비즈니스 환경과 전문적인 서비스를 지원합니다.
        </div>
        <div className="UsingMainTitle2">지원 서비스</div>
        <div className="info-section">
          <div className="info-unit">
            <div className="info-container">
              <div className="img-container">
                <img src={img07} alt="프린터/스캔" />
              </div>
            </div>
            <div className="info-text-content-support">
              <p>프린터/스캔</p>
            </div>
          </div>
          <div className="info-unit">
            <div className="info-container">
              <div className="img-container">
                <img src={img08} alt="카페테리아" />
              </div>
            </div>
            <div className="info-text-content-support">
              <p>카페테리아</p>
            </div>
          </div>
          <div className="info-unit">
            <div className="info-container">
              <div className="img-container">
                <img src={img09} alt="냉장고" />
              </div>
            </div>
            <div className="info-text-content-support">
              <p>냉장고</p>
            </div>
          </div>
          <div className="info-unit">
            <div className="info-container">
              <div className="img-container">
                <img src={img10} alt="회의실" />
              </div>
            </div>
            <div className="info-text-content-support">
              <p>회의실</p>
            </div>
          </div>
          <div className="info-unit">
            <div className="info-container">
              <div className="img-container">
                <img src={img11} alt="주차지원" />
              </div>
            </div>
            <div className="info-text-content-support">
              <p>주차 지원</p>
            </div>
          </div>
          <div className="info-unit">
            <div className="info-container">
              <div className="img-container">
                <img src={img12} alt="락커 지원" />
              </div>
            </div>
            <div className="info-text-content-support">
              <p>락커 지원</p>
            </div>
          </div>
        </div>
          <div className="inquiry">
          <p>지금 바로 방문하시고, 프리미엄 오피스를 경험해보세요!</p>
          <h2>문의 전화: 031-898-7012</h2>
        </div>
      </div>
    </div>
  );
};

export default InfoSharedOffice;