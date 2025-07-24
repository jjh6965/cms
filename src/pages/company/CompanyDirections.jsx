import Sidetab2 from "../company/CompanyDirectionsSide";
import Content2 from "../company/CompanyDirectionsContent";
import "../company/CompanyDirections.css";
import Company from "./Share";

const CompanyDirections = () => {
    return (
        <div className="directionswrap">
            <Company paths={[{ label: "소개"}, {label: "오시는 길"}]} />
        

        <div className="directions-inner">
            <Sidetab2 />
            <Content2 />
        </div>
        </div>
    );
}
export default CompanyDirections;