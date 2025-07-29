import Content from "../company/CompanyPriceInfoContent";
import "../company/CompanyPriceInfo.css";
import Company from "./Share";
import SideMenu from "./SideMenu";

const CompanyPriceInfo = ({ onMenuClick }) => {
  return (
      <div className="priceinfo-inner">
        <Content onMenuClick={onMenuClick} />
      </div>
  );
};

export default CompanyPriceInfo;
