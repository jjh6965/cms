import Company from "./Share";
import { Link } from "react-router-dom";
import "../company/CompanyCaution.css";
import img13 from "../../assets/images/caution.jpg";

export default function Caution() {
  return (
    <div className="section">
      <div className="logo">
        <Company paths={[{ label: "주의사항" }, { label: "공유 오피스 이용시 주의사항" }]} />
      </div>
      <div className="about-caution">
        <div className="sidebar">
          <div className="square">
            <span className="SideCautionTitle">이용 안내</span>
          </div>
          <div className="mini-square">
            <Link to="/company/CompanyUsing">공유 오피스 이용 안내</Link>
          </div>
          <div className="mini-square2">
            <Link to="/company/CompanyCaution">이용시 주의사항</Link>
          </div>
        </div>

        <div className="about-content">
          <div className="MainCautionTitle">공유 오피스 이용 시 주의사항</div>
          <div className="using-office">
            <div className="SubCautionTitle1">주의 사항</div>
            <div className="info-container">
              <div className="img-container">
                <img src={img13} alt="주의사항" />
              </div>
            </div>
            <div className="info-text-content">
              <div className="SubCautionContent1">
                <p>- 외부인이 방문 시 다른분들에게 피해가 가지 않도록 기본 매너를 지켜주세요.</p>
                <p>- 다른 분들에게 피해를 주는 행위 금지해주세요. (문 살짝, 이야기는 소곤소곤, 토론은 회의실에서 등등)</p>
                <p>- 개인 소지품은 본인이 관리해 주세요. 분실 시 책임지지 않습니다.</p>
                <p>- 소음 방지를 위해 호실 문을 닫아주시고, 고성방가 및 과한 소음은 자제해주세요.</p>
                <p>- 반려동물은 출입을 금합니다.</p>
                <p>- 보안을 위하여 CCTV 녹화중입니다.</p>
              </div>

              <div className="SubCautionTitle2">※안전주의※</div>
              <div className="SubCautionContent2">
                <p>본 시설 내 본인의 부주의로 인한 사고는 책임지지 않습니다.</p>
                <p>화재, 낙상, 부상 등에 대한 책임은 이용자 본인에게 있습니다.</p>
                <p>시설 내 본인의 부주의로 물건 파손 시 변상 조치 하여야 합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
