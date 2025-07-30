import img22 from "../../assets/images/Image_fx16.jpg";
import img23 from "../../assets/images/Image_fx17.jpg";
import img24 from "../../assets/images/Image_fx18.jpg";
import img25 from "../../assets/images/Image_fx19.jpg";
import { Link } from "react-router-dom";


const MainInfoSection2 = () => {
    return (
    <div className="info-2-section">
      <div className="info-2-container">
        <Link to="/company/SingleRoom" className="img-2-container">
          <img src={img22} alt="1인실" />

          <div className="overlay-text">1인실</div>
        </Link>
      </div>
      <div className="info-2-container">
        <Link to="/company/DoubleRoom" className="img-2-container">
          <img src={img23} alt="2인실" />
          <div className="overlay-text">2인실</div>
        </Link>
      </div>
      <div className="info-2-container">
        <Link to="/company/QuadRoom" className="img-2-container">
          <img src={img24} alt="4인실" />

          <div className="overlay-text">4인실</div>
        </Link>
      </div>
      <div className="info-2-container">
        <Link to="/company/OctaRoom" className="img-2-container">
          <img src={img25} alt="8인실" />

          <div className="overlay-text">8인실</div>
        </Link>
      </div>
    </div>
    );
}
export default MainInfoSection2;
