import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { performLogin } from "../service/login";
import "./user/Login.css";
import Join from "../pages/user/Join";
import PasswordChange from "../pages/user/PasswordChange";
import { msgPopup } from "../utils/msgPopup";
import { errorMsgPopup } from "../utils/errorMsgPopup";

const Login = () => {
  const [empNo, setEmpNo] = useState("admin");
  const [empPwd, setEmpPwd] = useState("new1234!");
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);
  const [isManualPasswordChange, setIsManualPasswordChange] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await performLogin("web", empNo, empPwd, navigate, (error) => {
      errorMsgPopup(error);
    });

    if (response && response.data.user.pwdChgYn === "Y") {
      setIsManualPasswordChange(false);
      msgPopup("기간이 만료되어 비밀번호를 변경해야 합니다.");
      setShowPasswordChangePopup(true);
    }
  };

  const handleMobileLoginRedirect = () => {
    navigate("/mobile/Login");
  };

  const handleJoinClick = () => {
    setShowJoinPopup(true);
  };

  const handlePasswordChangeClick = () => {
    setIsManualPasswordChange(true);
    setShowPasswordChangePopup(true);
  };

  return (
    <div className="login-form-container">
      <h1>로그인</h1>
      <form onSubmit={handleLogin}>
        <div className="login-form-group-container">
          <div className="login-form-group">
            <label htmlFor="empNo">아이디</label>
            <input
              id="empNo"
              type="text"
              name="empNo"
              placeholder="아이디를 입력하세요"
              value={empNo}
              onChange={(e) => setEmpNo(e.target.value)}
              required
            />
          </div>
          <div className="login-form-group">
            <label htmlFor="empPwd">비밀번호</label>
            <input
              id="empPwd"
              type="password"
              name="empPwd"
              placeholder="비밀번호를 입력하세요"
              value={empPwd}
              onChange={(e) => setEmpPwd(e.target.value)}
              required
            />
          </div>
          <div className="login-btn-group">
            <div className="login-btn-row1">
            <div className="login-btn-login">
              <button type="submit">로그인</button>
            </div>
            <div className="login-btn-signup">
              <button type="button" onClick={handleJoinClick}>
                회원가입
              </button>
            </div>
            </div>
            <div className="login-btn-row2">
            <div className="login-btn-pwc">
              <button type="button" onClick={handlePasswordChangeClick}>
                비밀번호 변경
              </button>
            </div>
            <div className="login-btn-pwc">
              <button type="button" onClick={handleMobileLoginRedirect}>
                모바일로그인으로 이동
              </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <Join show={showJoinPopup} onHide={() => setShowJoinPopup(false)} />
      <PasswordChange
        show={showPasswordChangePopup}
        onHide={() => setShowPasswordChangePopup(false)}
        initialEmpNo={empNo}
        isEditable={isManualPasswordChange}
      />
    </div>
  );
};

export default Login;
