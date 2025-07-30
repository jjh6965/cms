import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Board from './Board';
import useStore from '../../store/store';
import { hasPermission } from '../../utils/authUtils';
import "../main/MainHome.css";
import styles from './MainHome.module.css';
import MainInfoPage from "../main/MainInfoPage";
import axios from "axios";

const MainHome = () => {
  const { user, notices, fetchNotices } = useStore();
  const navigate = useNavigate();
  const canWriteBoard = user && hasPermission(user.auth, 'mainBoard');
  const chatContainerRef = useRef(null); // 챗봇 컨테이너 참조
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const slideImages = [
    'src/assets/images/Image_fx1.jpg',
    'src/assets/images/Image_fx6.jpg',
    'src/assets/images/Image_fx11.jpg',
  ];

  // 자동 스크롤: 챗봇 메시지 또는 로딩 상태 변경 시 챗봇 채팅창만 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!user || !hasPermission(user.auth, 'mainhome')) {
      // navigate('/');
      return;
    }

    // 챗봇 초기화: 환영 메시지
    setMessages([{ text: '안녕하세요! 무엇을 도와드릴까요?', sender: 'bot' }]);

    const swiperButtonPrev = document.querySelector('.swiper-button-prev');
    const swiperButtonNext = document.querySelector('.swiper-button-next');

    if (swiperButtonPrev) {
      swiperButtonPrev.style.color = '#547574';
    }

    if (swiperButtonNext) {
      swiperButtonNext.style.color = '#547574';
    }
  }, [user, navigate, fetchNotices]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { text: message, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/chatbot/message', message, {
        headers: { 'Content-Type': 'text/plain' },
        withCredentials: true // JWT 쿠키 전송
      });
      const botResponse = response.data;
      setMessages((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
    } catch (error) {
      console.error('챗봇 응답 오류:', error);
      let errorMessage = '죄송합니다. 서버와 통신 중 문제가 발생했습니다.';
      if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?';
      }
      setMessages((prev) => [...prev, { text: errorMessage, sender: 'bot' }]);
    }

    setMessage('');
    setIsLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#fff', color: '#000' }}>
      <div className="d-flex flex-column h-100 p-2" style={{ width: "98vw" }}>
        <div className="mainslider w-100">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop
            style={{ height: '500px', width: '1000px', borderRadius: '5px' }}
          >
            {slideImages.map((image, index) => (
              <SwiperSlide key={index}>
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-100 h-100 object-fit-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="d-flex w-100 flex-grow-1">
          <div className={`w-50 ${styles.contentLeftContainer}`}>
            <Board notices={notices} canWriteBoard={canWriteBoard} />
          </div>
          <div className='px-1'></div>
          <div className={`w-50 p-3 border ${styles.contentRightContainer}`} style={{ backgroundColor: '#fff', color: '#000' }}>
            <h3 className={`mb-3 fs-5 ${styles.boardTitle}`} style={{ color: '#FF7F50' }}>Chatbot</h3>
            <div
              ref={chatContainerRef} // 챗봇 컨테이너 참조
              className="chatbot-messages"
              style={{ 
                height: '300px', 
                overflowY: 'auto', 
                marginBottom: '10px', 
                backgroundColor: '#fff', 
                color: '#000', 
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`} style={{
                  margin: '5px',
                  padding: '10px',
                  borderRadius: '5px',
                  background: msg.sender === 'user' ? '#FF7F50' : '#f1f1f1',
                  color: msg.sender === 'user' ? 'white' : 'black',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}>
                  {msg.text}
                </div>
              ))}
              {isLoading && <div className="message bot" style={{ background: '#f1f1f1', color: 'black' }}>Typing...</div>}
            </div>
            <form onSubmit={handleChatSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  style={{ backgroundColor: '#fff', color: '#000' }}
                />
              </div>
              <button type="submit" className="btn" style={{ backgroundColor: '#FF7F50', color: 'white' }}>보내기</button>
            </form>
          </div>
        </div>
        <MainInfoPage />
      </div>
    </div>
  );
};

export default MainHome;