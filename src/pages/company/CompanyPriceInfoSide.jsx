import { Link } from "react-router-dom";

const CompanyPriceInfoSide = () => {
    return (

        <div className="SideWrapper">
            <div className="SideTitle">
                <div className="PriceSideTitle">시설 안내</div>
            </div>
            <div className="SideCon">
                <Link to="/company/CompanyPriceInfo">price</Link>
            </div>
        </div>

    )
}

export default CompanyPriceInfoSide;