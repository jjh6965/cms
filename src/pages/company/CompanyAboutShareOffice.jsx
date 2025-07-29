import Company from "./Share";
import { Link } from "react-router-dom";

import "../company/CompanyAboutShareOffice.css";
import img01 from "../../assets/images/Image_fx_20.jpg";
import img02 from "../../assets/images/cafeteria.jpg";
import img03 from "../../assets/images/company2.jpg";
import img04 from "../../assets/images/company3.jpg";
import img05 from "../../assets/images/subway.jpg";
import img06 from "../../assets/images/infra.jpg";


export default function AboutPartner() {
    return (
        <div className="section">
            <div className="logo">
                <Company
                    paths={[
                        { label: "소개", link: "/company" },
                        { label: "공유 오피스 소개" },
                    ]}
                />
            </div>
            <div className="about-company">
                <div className="sidebar">
                    <div className="square">
                        <h2>소개</h2>
                    </div>
                    <div className="mini-square"><Link to='/company'>공유 오피스 소개</Link></div>
                </div>

                <div className="about-content">
                    <h1>공유 오피스 소개</h1>
                    <p>
                        안녕하세요, 장안구 프리미엄 공유 오피스 (주)시키면한다
                        입니다.
                    </p>
                    <p>
                        {" "}
                        저희는 합리적인 가격과 더불어 다양한 부대 서비스를
                        제공하는 프리미엄 오피스 공간으로, 쾌적하고 효율적인
                        업무 환경을 약속드립니다.
                    </p>

                    <p>
                        {" "}
                        고객님의 성공을 응원하며, 언제나 최상의 서비스를 위해
                        노력하겠습니다.
                    </p>
                    <div className="company-info">
                        <div className="info-container">
                            <div className="img-container-01">
                                <img
                                    src={img01}
                                    alt="독립형 사무공간 제공"
                                />
                            </div>
                            <div className="info-text-content">
                                <h3>독립형 사무공간 제공</h3>
                                <p>1인실/2인실/4인실/8인실</p>
                            </div>
                        </div>
                        <div className="info-container">
                            <div className="img-container-01">
                                <img
                                    src={img02}
                                    alt="휴게 공간 밎 카페테리아 제공"
                                />
                            </div>
                            <div className="info-text-content">
                                <h3>휴게 공간 밎 카페테리아</h3>
                                <p>
                                    무료 커피/음료 및 인터넷, 복사, 팩스 등 사무
                                    인프라 지원
                                </p>
                            </div>
                        </div>
                        <div className="info-container">
                            <div className="img-container-01">
                                <img
                                    src={img03}
                                    alt="냉,난방비 부담 없음"
                                />
                            </div>
                            <div className="info-text-content">
                                <h3>관리비 부담 ZERO</h3>
                                <p>냉난방비 포함 관리비 부담 zero.</p>
                            </div>
                        </div>
                        <div className="info-container">
                            <div className="img-container-01">
                                <img
                                    src={img04}
                                    alt="주차시설 보유"
                                />
                            </div>
                            <div className="info-text-content">
                                <h3>주차시설 보유</h3>
                            </div>
                        </div>
                    </div>
                    <h3>위치 안내</h3>
                    <div className="info-container">
                        <div className="img-container-01">
                            <img src={img05} alt="지하철" />
                        </div>
                        <div className="info-text-content">
                            <h3>편리한 교통환경</h3>
                            <p>
                                신분당선 수원역
                                <br /> 대중교통 14분
                            </p>
                        </div>
                    </div>
                    <div className="info-container">
                        <div className="img-container-01">
                            <img src={img06} alt="인프라" />
                        </div>
                        <div className="info-text-content">
                            <h3>편의실 인접</h3>
                            <p>
                                화성행궁 및 행궁동 카페거리
                                편의점,카페,은행 등 주변 인프라 GOOD
                            </p>
                        </div>
                    </div>
                    <div className="inquiry">
                    <p>지금 바로 방문하시고, 프리미엄 오피스를 경험해보세요!</p>
                    <h2>문의 전화: 031-898-7012</h2>
                    </div>
                </div>
            </div>
        </div>
    );
}
