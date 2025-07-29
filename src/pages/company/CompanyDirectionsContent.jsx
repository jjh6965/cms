import NaverMaps from "../company/NaverMap";

const CompanyDirectionsContent = () => {
    const handleNaverMapClick = () => {
    const destination = encodeURIComponent("경기도 수원시 장안구 정조로 940-1 영화동 연세IT미래교육원 빌딩");
    const naverMapUrl = `https://map.naver.com/v5/directions/-/,-,${destination},CAR,,?entry=entry`;
    window.open(naverMapUrl, "_blank");
  };
    return (
        <div className="MainWrapper1">
            <div className="Entire">
                <div className="MainDirectionsTitle">오시는 길<button className="btn-directions" onClick={handleNaverMapClick}>길 찾기</button></div>
                
                <NaverMaps />
                <div className="SubTitle">주소</div>
                <div className="SubContent">경기도 수원시 장안구 정조로 940-1(영화동, 연세IT미래교육원 빌딩)</div>
                <div className="SubTitle">상담 문의</div>
                <div className="SubContent">031-256-2662</div>
                <div className="SubContent">상담 가능 시간: 09시 ~ 18시</div>
                <div className="SubTitle">대중교통</div>
                <div className="SubContent">수원역에서 버스로 14분타고 장안문 정류장에서 하차</div>
                <div className="SubContent">※ 주말 및 공휴일은 휴무입니다. 휴무 중에는 빠른 답변이 어려우니 양해를 부탁드립니다.</div>
            </div>
        </div>
    );
}
export default CompanyDirectionsContent;