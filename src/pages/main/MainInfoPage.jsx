import MainInfoSection1 from "./MainInfoSection1"
import MainInfoSection2 from "./MainInfoSection2"
import "../main/MainInfoPage.css";

const MainInfoPage = () => {
    return (
        <div className="MainInfoWrapper">
            <MainInfoSection1 />
            <MainInfoSection2 />
        </div>
    )
}
export default MainInfoPage;