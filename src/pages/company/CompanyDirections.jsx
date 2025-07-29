import Content2 from "../company/CompanyDirectionsContent";
import "../company/CompanyDirections.css";
import Company from "./Share";

const CompanyDirections = () => {
    return (
        <div className="directionswrap">
            <Company paths={[{ label: "소개"}, {label: "오시는 길"}]} />
        <div className="directions-inner">            
            <Content2 />
        </div>
        </div>
    );
}
export default CompanyDirections;