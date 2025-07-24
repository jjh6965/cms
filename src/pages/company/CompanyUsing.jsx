import Company from "./Share";
import { Link } from "react-router-dom";
import img07 from "../../assets/images/Image_fx21.jpg";
import img08 from "../../assets/images/cafeteria.jpg";
import img09 from "../../assets/images/refrigerator.jpg";
import img10 from "../../assets/images/office.jpg";
import img11 from "../../assets/images/support.jpg";
import img12 from "../../assets/images/lockerRoom.jpg";

import "../company/CompanyUsing.css";
export default function Using() {
  return (
    <div className="section">
      <div className="logo">
        <Company paths={[{ label: "이용 안내" }, { label: "공유 오피스 이용 안내" }]} />
      </div>
      <div className="about-using">
        <div className="sidebar">
          <div className="square">
            <div className="SideCautionTitle">이용 안내</div>
          </div>
          <div className="mini-square">
            <Link to="/company/CompanyUsing">공유 오피스 이용 안내</Link>
          </div>
          <div className="mini-square2">
            <Link to="/company/CompanyCaution">이용시 주의사항</Link>
          </div>
        </div>

        <div className="about-content">
          <div className="UsingMainTitle1">공유 오피스 이용 안내</div>
          <div className="using-office">
            <div className="UsingSubTitle">프린터/스캔</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img07} alt="프린터/스캔" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="UsingContent">
                <p>-흑백무료</p>
                <p>-컬러 장당 200원 (카드만 가능. 결제해야 출력이 됩니다.)</p>
                <p>-출력 용지는 본인이 준비해주세요.</p>
                <p>-문구용품은 사용 후 제자리에 놓아주세요.</p>
              </div>
            </div>
            <div className="UsingSubTitle">카페테리아</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img08} alt="카페테리아" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="UsingContent">
                <p>-커피, 차는 무료입니다.</p>
                <p>-이용 시 뒷정리는 깨끗하게 부탁드립니다. (퇴수는 싱크대를 이용, 음료 섭취 후 컵은 헹궈서 컵 수거함에)</p>
                <p>-카페 공간 내 간단한 음식 섭취는 가능합니다. (치킨, 피자, 라면 등 냄새가 심한 음식은 식당을 이용해주세요.)</p>
                <p>-전자렌지 이용 후 뒤처리까지 깔끔하게 해주세요.</p>
                <p>-쓰레기는 일반/재활용 분리도 철저히 부탁드려요. (음식물 쓰레기는 본인이 처리해 주셔야 합니다.)</p>
                <p>-커피와 차의 외부반출은 금해주세요.</p>
              </div>
            </div>
            <div className="UsingSubTitle">냉장고</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img09} alt="냉장고" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="UsingContent">
                <p>-냉장고 보관 기간은 일주일입니다.</p>
                <p>-보관 시 호실, 보관 시작일을 적어주세요.</p>
                <p>-일주일이 지난 제품은 확인하는 대로 폐기처분 합니다.</p>
                <p>-냄새가 나는 제품은 보관을 피해주세요. (뚜껑이 없는 음식은 보관 불가)</p>
              </div>
            </div>
            <div className="UsingSubTitle">회의실</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img10} alt="회의실" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="UsingContent">
                <p>-회의실 외부이용객은 평일 09:00~18:00 이용.</p>
                <p>-입주사는 18시 이후도 이용 가능 (호실당 월 20시간 이용가능)</p>
                <p>-인터넷, TV 무료 이용 가능합니다</p>
                <p>-사용 전 사전 예약하고 이용해주세요.</p>
                <p>-추가 이용 시 이용료는 1시간에 15,000원입니다.. (계좌이체만 가능함을 양해 부탁드려요)</p>
                <p>-시간 엄수, 사용 후 뒷정리는 필수입니다.</p>
                <p>-분실물은 책임지지 않습니다.</p>
              </div>
            </div>
            <div className="UsingSubTitle">주차 지원</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img11} alt="주차지원" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="UsingContent">
                <p>-6개월 이상 계약한 호실에 한해 계약 기간 동안 주차비 지원</p>
              </div>
            </div>
            <div className="UsingSubTitle">락커 지원</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img12} alt="락커 지원" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="UsingContent">
                <p>-락커 렌탈비용 월 1만원 지원</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
