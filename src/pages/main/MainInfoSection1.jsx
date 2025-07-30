import img18 from "../../assets/images/Image_fx12.jpg";
import img19 from "../../assets/images/Image_fx13.jpg";
import img20 from "../../assets/images/Image_fx14.jpg";
import img21 from "../../assets/images/Image_fx15.jpg";

const MainInfoSection1 = () => {
  return (
    <div className="info-section">
      <div className="info-container">
        <div className="info-text-content">
          <div className="MainInfoSectionTitle">
            편리한 교통환경
            <p>신분당선 수원역</p>
            <p>대중교통 14분</p>
          </div>
        </div>
        <div className="img-container">
          <img src={img18} alt="수원역" />
        </div>
      </div>
      <div className="info-container">
        <div className="info-text-content">
          <div className="MainInfoSectionTitle">
            주변 환경
            <p>수원 화성 북문거리</p>
            <p>먹거리, 상권 밀집</p>
          </div>
        </div>
        <div className="img-container">
          <img src={img19} alt="주변 환경" />
        </div>
      </div>
      <div className="info-container">
        <div className="info-text-content">
          <div className="MainInfoSectionTitle">
            안전한 생활
            <p>CCTV, 관리자 상주, 스프링쿨러, 소화기 비치, 24시간 출입(지문인식)</p>
          </div>
        </div>
        <div className="img-container">
          <img src={img20} alt="안전한 생활" />
        </div>
      </div>
      <div className="info-container">
        <div className="info-text-content">
          <div className="MainInfoSectionTitle">
            프라이빗한 오피스 공간
            <p>개별 공간으로 작업 공간 및 업무 능력 향상</p>
          </div>
        </div>
        <div className="img-container">
          <img src={img21} alt="프라이빗한 오피스 공간" />
        </div>
      </div>
    </div>
  );
};
export default MainInfoSection1;
