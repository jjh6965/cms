import img01 from "../../assets/images/Image_fx_20.jpg";
import img02 from "../../assets/images/cafeteria.jpg";
import img03 from "../../assets/images/company2.jpg";
import img04 from "../../assets/images/company3.jpg";
import img05 from "../../assets/images/subway.jpg";
import img06 from "../../assets/images/infra.jpg";

import "../company/CompanyFacilities.css";

const CompanyFacilities = () => {
    // 네이버 지도 길찾기 URL 생성 함수
  const handleNaverMapClick = () => {
    const destination = encodeURIComponent("경기도 수원시 장안구 정조로 940-1 영화동 연세IT미래교육원 빌딩");
    const naverMapUrl = `https://map.naver.com/v5/directions/-/,-,${destination},CAR,,?entry=entry`;
    window.open(naverMapUrl, "_blank");
  };
  return (
    <div>
      <div className="about-content">
        <h1>편의 시설</h1>
        {/* 4개 사진을 한 줄에 나열 */}
        <div className="company-info">
          <div className="info-container">
            <div className="img-container-01">
              <img src={img01} alt="독립형 사무공간 제공" />
            </div>
            <div className="info-text-content">
              <h3>독립형 사무공간 제공</h3>
              <p>1인실/2인실/4인실/8인실</p>
            </div>
          </div>
          <div className="info-container">
            <div className="img-container-01">
              <img src={img02} alt="휴게 공간 밎 카페테리아 제공" />
            </div>
            <div className="info-text-content">
              <h3>휴게 공간 밎 카페테리아</h3>
              <p>무료 커피/음료 및 인터넷, 복사, 팩스 등 사무 인프라 지원</p>
            </div>
          </div>
          <div className="info-container">
            <div className="img-container-01">
              <img src={img03} alt="냉,난방비 부담 없음" />
            </div>
            <div className="info-text-content">
              <h3>관리비 부담 ZERO</h3>
              <p>냉난방비 포함 관리비 부담 zero.</p>
            </div>
          </div>
          <div className="info-container">
            <div className="img-container-01">
              <img src={img04} alt="주차시설 보유" />
            </div>
            <div className="info-text-content">
              <h3>주차시설 보유</h3>
            </div>
          </div>
        </div>
        <h1>위치 안내</h1>
        {/* 2개 사진을 가로로 붙여서 나열 */}
        <div className="company-info">
          <div className="info-container">
            <div className="img-container-01">
              <img src={img05} alt="지하철"  onClick={handleNaverMapClick} style={{cursor: "pointer"}}/>
            </div>
            <div className="info-text-content">
              <h3>편리한 교통환경</h3>
              <p>
                신분당선 수원역
                <br /> 대중교통 14분
              </p>
            </div>
          </div>
          <div className="info-container">
            <div className="img-container-01">
              <img src={img06} alt="인프라" />
            </div>
            <div className="info-text-content">
              <h3>편의실 인접</h3>
              <p>화성행궁 및 행궁동 카페거리 편의점,카페,은행 등 주변 인프라 GOOD</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CompanyFacilities;