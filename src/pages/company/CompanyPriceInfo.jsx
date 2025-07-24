import Sidetab from "../company/CompanyPriceInfoSide";
import Content from "../company/CompanyPriceInfoContent";
import "../company/CompanyPriceInfo.css";
import Company from "./Share";

const CompanyPriceInfo = () => {
  return (
    <div className="priceinfowrap">
      <Company paths={[{ label: "소개" }, { label: "가격 안내" }]} />

      {/* 💡 여기 새로 감싸는 div 추가!! */}
      <div className="priceinfo-inner">
        <Sidetab />
        <Content />
      </div>
    </div>
  );
};

export default CompanyPriceInfo;
