import { Link } from "react-router-dom";

const CompanyDirectionsSide = () => {
    return (
        <div className="SideWrapper1">
            <div className="SideDirectionsTitle">
               <div className="DirectionsSideTitle">오시는 길</div>
            </div>
            <div className="DirectionsCon">
               <Link to="/company/CompanyDirections"> Directions</Link>
            </div>
        </div>
    );
}
export default CompanyDirectionsSide;