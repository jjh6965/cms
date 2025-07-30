import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import CommonPopup from "../../components/popup/CommonPopup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../utils/api";
import common from "../../utils/common"; // [추가] Added for getServerUrl

/**
 * 프리미엄 공유 오피스 예약 시스템
 * WeWork 스타일의 고급스러운 UI/UX를 제공하는 룸 예약 시스템
 * 기존 CommonPopup 비즈니스 로직을 유지하면서 세련된 디자인 적용
 */
const Reservation3 = () => {
  const { user } = useStore();
  const navigate = useNavigate();

  // 동적 룸 데이터 상태 관리
  // [수정] 하드코딩된 룸 데이터를 유지하고, 예약 상태는 /api/reservation/reservation/list로 업데이트
  const [rooms, setRooms] = useState([
    { 
      id: "4A", 
      label: "4인실-A", 
      type: "프리미엄", 
      capacity: 4,
      x: 0, 
      y: 0, 
      width: 9, 
      height: 1, 
      color: "#FF6B35", 
      status: "예약가능", 
      price: 900000,
      amenities: ["4K 모니터", "화상회의 시설", "프리미엄 의자", "화이트보드"]
    },
    { 
      id: "4B", 
      label: "4인실-B", 
      type: "프리미엄", 
      capacity: 4,
      x: 9, 
      y: 0, 
      width: 10, 
      height: 1, 
      color: "#FF6B35", 
      status: "예약가능", 
      price: 900000,
      amenities: ["4K 모니터", "화상회의 시설", "프리미엄 의자", "화이트보드"]
    },
    { 
      id: "1A", 
      label: "1인실-A", 
      type: "프라이빗", 
      capacity: 1,
      x: 0, 
      y: 1, 
      width: 5, // Increased width to prevent overlap
      height: 1, 
      color: "#9D4EDD", 
      status: "예약가능", 
      price: 300000,
      amenities: ["개인 데스크", "조명 조절", "집중형 환경"]
    },
    { 
      id: "1B", 
      label: "1인실-B", 
      type: "프라이빗", 
      capacity: 1,
      x: 0, 
      y: 2, 
      width: 5, // Increased width to prevent overlap
      height: 1, 
      color: "#9D4EDD", 
      status: "예약가능", 
      price: 300000,
      amenities: ["개인 데스크", "조명 조절", "집중형 환경"]
    },
    { 
      id: "1C", 
      label: "1인실-C", 
      type: "프라이빗", 
      capacity: 1,
      x: 0, 
      y: 3, 
      width: 5, // Increased width to prevent overlap
      height: 1, 
      color: "#9D4EDD", 
      status: "예약가능", 
      price: 300000,
      amenities: ["개인 데스크", "조명 조절", "집중형 환경"]
    },
    { 
      id: "1D", 
      label: "1인실-D", 
      type: "프라이빗", 
      capacity: 1,
      x: 0, 
      y: 4, 
      width: 5, // Increased width to prevent overlap
      height: 1, 
      color: "#9D4EDD", 
      status: "예약가능", 
      price: 300000,
      amenities: ["개인 데스크", "조명 조절", "집중형 환경"]
    },
    { 
      id: "2A", 
      label: "2인실-A", 
      type: "스탠다드", 
      capacity: 2,
      x: 12, 
      y: 1, 
      width: 7, // Increased width to prevent overlap
      height: 1, 
      color: "#4CC9F0", 
      status: "예약가능", 
      price: 550000,
      amenities: ["듀얼 모니터", "에르고노믹 의자", "개인 사물함", "화이트보드"]
    },
    { 
      id: "2B", 
      label: "2인실-B", 
      type: "스탠다드", 
      capacity: 2,
      x: 12, 
      y: 2, 
      width: 7, // Increased width to prevent overlap
      height: 1, 
      color: "#4CC9F0", 
      status: "예약가능", 
      price: 550000,
      amenities: ["듀얼 모니터", "에르고노믹 의자", "개인 사물함", "화이트보드"]
    },
    { 
      id: "2C", 
      label: "2인실-C", 
      type: "스탠다드", 
      capacity: 2,
      x: 12, 
      y: 3, 
      width: 7, // Increased width to prevent overlap
      height: 1, 
      color: "#4CC9F0", 
      status: "예약가능", 
      price: 550000,
      amenities: ["듀얼 모니터", "에르고노믹 의자", "개인 사물함", "화이트보드"]
    },
    { 
      id: "2D", 
      label: "2인실-D", 
      type: "스탠다드", 
      capacity: 2,
      x: 12, 
      y: 4, 
      width: 7, // Increased width to prevent overlap
      height: 1, 
      color: "#4CC9F0", 
      status: "예약가능", 
      price: 550000,
      amenities: ["듀얼 모니터", "에르고노믹 의자", "개인 사물함", "화이트보드"]
    },
  ]);

  const [reservedRooms, setReservedRooms] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: "", gender: "", phone: "", date: null, duration: "" });

  // 통계 데이터 계산
  const getStatistics = () => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(room => room.status === "예약가능").length;
    const reservedRoomsCount = totalRooms - availableRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((reservedRoomsCount / totalRooms) * 100) : 0;
    
    return {
      totalRooms,
      availableRooms,
      reservedRooms: reservedRoomsCount,
      occupancyRate,
      satisfactionRate: 98
    };
  };

  /**
   * 룸 클릭 이벤트 처리
   * 예약 가능 상태일 때만 팝업 표시
   */
  const handleRoomClick = (room) => {
    if (room.status === "예약가능") {
      setSelectedRoom(room);
      setShowPopup(true);
    } else {
      alert(`${room.label}은(는) 이미 예약되었습니다.`);
    }
  };

  /**
   * 사용자 입력값 변경 처리
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * 날짜 변경 처리
   */
  const handleDateChange = (date) => {
    setUserInfo((prev) => ({ ...prev, date }));
  };

  /**
   * 예약 기간 버튼 클릭 처리
   */
  const handleDurationClick = (duration) => {
    setUserInfo((prev) => ({ ...prev, duration }));
  };

  /**
   * 예약 확정 처리 - CommonPopup 비즈니스 로직 유지
   * [수정] 서버에 예약 데이터를 저장하도록 API 호출 추가
   */
  const handleConfirm = async () => {
    if (userInfo.name && userInfo.gender && userInfo.phone && userInfo.date && userInfo.duration) {
      const reservationId = `IMSI${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
      const reservationData = {
        params: {
          pGUBUN: "I",
          pRESERVATIONID: reservationId,
          pROOMID: selectedRoom.id,
          pEMPNO: user?.empNo || "",
          pNAME: userInfo.name,
          pGENDER: userInfo.gender,
          pPHONE: userInfo.phone,
          pRESERVATIONDATE: userInfo.date.toISOString().split("T")[0],
          pDURATION: userInfo.duration,
          pSTATUS: "사용 중",
        },
      };
      // 통신 경로 지정
      try {
        console.log("Sending reservation data:", reservationData); // Debug log
        const response = await api.post(common.getServerUrl("reservation/reservation/save"), reservationData);
        console.log("API response:", response); // Debug log
        if (response.data.success) {
          setReservedRooms([...reservedRooms, selectedRoom.id]);
          setRooms(rooms.map((room) => (room.id === selectedRoom.id ? { ...room, status: "사용 중" } : room)));
          console.log("예약 확정:", { room: selectedRoom.label, ...userInfo });
          setShowPopup(false);
          setSelectedRoom(null);
          setUserInfo({ name: "", gender: "", phone: "", date: null, duration: "" });
          alert(`${selectedRoom.label} 예약이 완료되었습니다!`);
        } else {
          alert("예약 저장에 실패했습니다: " + (response.data.message || "서버 응답 오류"));
        }
      } catch (error) {
        console.error("예약 저장 오류:", error, {
          url: common.getServerUrl("reservation/reservation/save"),
          requestData: reservationData,
          response: error.response,
        });
        alert("예약 저장 중 오류가 발생했습니다: " + (error.response?.data?.message || error.message));
      }
    } else {
      alert("모든 필수 정보를 입력해주세요.");
    }
  };

  /**
   * 예약 취소 처리
   */
  const handleCancel = () => {
    setShowPopup(false);
    setSelectedRoom(null);
    setUserInfo({ name: "", gender: "", phone: "", date: null, duration: "" });
  };

  // 사용자 권한 체크
  // [수정] 권한 이름 ReservationManage에서 reservationCreate로 변경하여 Reservation4와 일치
  useEffect(() => {
    if (!user || !hasPermission(user.auth, "reservationCreate")) navigate("/");
  }, [user, navigate]);

  // [추가] 예약 데이터를 동적으로 가져와 룸 상태를 업데이트
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await api.post(common.getServerUrl("reservation/reservation/list"), { params: { DEBUG: "F" } });
        console.log("Fetched reservations:", response.data); // Debug log
        if (response.data.success && Array.isArray(response.data.data)) {
          const reservedRoomIds = response.data.data
            .filter((reservation) => reservation.STATUS === "사용 중")
            .map((reservation) => reservation.ROOMID);
          // [추가] 룸 상태를 예약 데이터에 따라 업데이트
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              reservedRoomIds.includes(room.id) ? { ...room, status: "사용 중" } : { ...room, status: "예약가능" }
            )
          );
          setReservedRooms(reservedRoomIds);
        } else {
          console.warn("No valid reservation data:", response.data.message || "No data");
          // [추가] 예약 데이터가 없으면 모든 룸을 예약 가능으로 설정
          setRooms((prevRooms) => prevRooms.map((room) => ({ ...room, status: "예약가능" })));
          setReservedRooms([]);
        }
      } catch (error) {
        console.error("Failed to fetch reservations:", error, {
          url: common.getServerUrl("reservation/reservation/list"),
          response: error.response,
        });
        alert("예약 데이터를 가져오는 중 오류가 발생했습니다: " + (error.response?.data?.message || error.message));
        // [추가] 오류 발생 시 모든 룸을 예약 가능으로 폴백
        setRooms((prevRooms) => prevRooms.map((room) => ({ ...room, status: "예약가능" })));
        setReservedRooms([]);
      }
    };

    fetchReservations(); // Initial fetch on mount
    const intervalId = setInterval(fetchReservations, 5000); // Poll every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to run once on mount and set up polling

  const statistics = getStatistics();

  return (
    <div style={{ 
      minHeight: "100vh", 
      maxWidth: "1400px", // [추가] 중앙 정렬을 위해 maxWidth 추가
      margin: "0 auto", // [추가] 중앙 정렬
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* 프리미엄 헤더 */}
      <header style={{
        background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        padding: "1.5rem 0"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "white",
              fontWeight: "bold"
            }}>
              🏢
            </div>
            <div>
              <h1 style={{
                color: "white",
                fontSize: "2rem",
                fontWeight: "700",
                margin: 0,
                background: "linear-gradient(45deg, #FFD700, #FFA500)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                (주)시한오피스
              </h1>
              <p style={{
                color: "#a8b9ff",
                fontSize: "0.9rem",
                margin: 0,
                fontWeight: "400"
              }}>
                A section 공유 오피스
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ 
              color: "#FFD700", 
              fontSize: "1rem",
              fontWeight: "500" 
            }}>
              관리자
            </span>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem"
            }}>
              JB
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main style={{ padding: "3rem 2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          
          {/* 페이지 타이틀 */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{
              fontSize: "3rem",
              fontWeight: "800",
              color: "white",
              textShadow: "2px 4px 12px rgba(0,0,0,0.3)",
              marginBottom: "1rem"
            }}>
              3F - 1/2/4인실
            </h2>
            <p style={{
              fontSize: "1.2rem",
              color: "rgba(255,255,255,0.9)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6"
            }}>
              최신 시설과 편안한 환경을 제공하는 프리미엄 공유 오피스에서 
              여러분의 비즈니스를 성장시켜보세요.
            </p>
          </div>

          {/* 통계 대시보드 - 수정: 4칸을 1줄로 재배치 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)", // Modified to 4 columns in one row
            gap: "1.5rem",
            marginBottom: "3rem"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  🏠
                </div>
                <div>
                  <p style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "white",
                    margin: 0
                  }}>
                    {statistics.totalRooms}
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "1rem",
                    margin: 0
                  }}>
                    전체 룸
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  ✅
                </div>
                <div>
                  <p style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "white",
                    margin: 0
                  }}>
                    {statistics.availableRooms}
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "1rem",
                    margin: 0
                  }}>
                    이용 가능
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  📊
                </div>
                <div>
                  <p style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "white",
                    margin: 0
                  }}>
                    {statistics.occupancyRate}%
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "1rem",
                    margin: 0
                  }}>
                    점유율
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  ⭐
                </div>
                <div>
                  <p style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "white",
                    margin: 0
                  }}>
                    {statistics.satisfactionRate}%
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "1rem",
                    margin: 0
                  }}>
                    만족도
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 플로어 맵 */}
          <div style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: "25px",
            padding: "3rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              {/* <h3 style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: "#2c3e50",
                marginBottom: "0.5rem"
              }}>
                플로어 맵
              </h3> */}
              <p style={{
                color: "#7f8c8d",
                fontSize: "1.1rem"
              }}>
                원하시는 룸을 클릭하여 예약하세요
              </p>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(19, 1fr)", // [수정] Increased columns to match Reservation4 and prevent overlap
              gap: "1rem",
              maxWidth: "1200px",
              margin: "0 auto"
            }}>
              {/* 룸 버튼들 렌더링 */}
              {rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    gridColumn: `${room.x + 1} / span ${room.width}`,
                    gridRow: `${room.y + 1} / span ${room.height}`,
                    background: room.status === "사용 중" 
                      ? "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)"
                      : `linear-gradient(135deg, ${room.color} 0%, ${room.color}dd 100%)`,
                    borderRadius: "15px",
                    padding: "1.5rem",
                    cursor: room.status === "사용 중" ? "not-allowed" : "pointer",
                    pointerEvents: room.status === "사용 중" ? "none" : "auto", // [추가] Prevent interaction with reserved rooms
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    border: "2px solid rgba(255,255,255,0.2)",
                    minHeight: "120px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: room.status === "사용 중" ? "none" : "translateY(0)",
                  }}
                  onClick={() => handleRoomClick(room)}
                  onMouseEnter={(e) => {
                    if (room.status !== "사용 중") {
                      e.target.style.transform = "translateY(-8px) scale(1.02)";
                      e.target.style.boxShadow = "0 15px 40px rgba(0,0,0,0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (room.status !== "사용 중") {
                      e.target.style.transform = "translateY(0) scale(1)";
                      e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                    }
                  }}
                >
                  {/* 룸 상태 배지 */}
                  <div style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: room.status === "예약가능" 
                      ? "rgba(46, 204, 113, 0.9)" 
                      : "rgba(231, 76, 60, 0.9)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "0.7rem",
                    fontWeight: "600"
                  }}>
                    {room.status === "예약가능" ? "이용가능" : "예약완료"}
                  </div>

                  <div style={{
                    textAlign: "center",
                    color: "white",
                    textShadow: "1px 2px 4px rgba(0,0,0,0.3)"
                  }}>
                    <h4 style={{
                      fontSize: "1.3rem",
                      fontWeight: "700",
                      margin: "0 0 0.5rem 0"
                    }}>
                      {room.label}
                    </h4>
                    <p style={{
                      fontSize: "0.9rem",
                      opacity: 0.9,
                      margin: "0 0 0.5rem 0"
                    }}>
                      {room.type} • {room.capacity}명
                    </p>
                    <p style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      margin: 0
                    }}>
                      ₩{room.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* 카페 스타일 라운지 공간 */}
              <div
                style={{
                  gridColumn: "6 / span 7",
                  gridRow: "2 / span 4",
                  background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                  borderRadius: "20px",
                  padding: "2rem",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                  border: "3px solid rgba(255,255,255,0.3)",
                  minHeight: "300px"
                }}
              >
                {/* 라운지 라벨 */}
                <div style={{
                  position: "absolute",
                  top: "15px",
                  left: "15px",
                  background: "rgba(52, 152, 219, 0.9)",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>
                  🏖️ 카페 라운지
                </div>

                {/* 카페 바 카운터 */}
                <div style={{
                  position: "absolute",
                  top: "60px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)",
                  borderRadius: "15px",
                  padding: "15px 25px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontSize: "1.5rem",
                    marginBottom: "5px"
                  }}>☕</div>
                  <div style={{
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}>Coffee Bar</div>
                </div>

                {/* 라운지 소파 구역 */}
                <div style={{
                  position: "absolute",
                  top: "140px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <div style={{
                    width: "35px",
                    height: "20px",
                    background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}></div>
                  <div style={{
                    width: "25px",
                    height: "15px",
                    background: "linear-gradient(135deg, #FF8E53 0%, #FF6B35 100%)",
                    borderRadius: "50%",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}></div>
                  <div style={{
                    width: "35px",
                    height: "20px",
                    background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}></div>
                </div>

                {/* 원형 카페 테이블들 */}
                <div style={{
                  position: "absolute",
                  bottom: "80px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px"
                }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    background: "linear-gradient(135deg, #F4D03F 0%, #F7DC6F 100%)",
                    borderRadius: "50%",
                    border: "3px solid #E67E22",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.1)"
                  }}></div>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    background: "linear-gradient(135deg, #F4D03F 0%, #F7DC6F 100%)",
                    borderRadius: "50%",
                    border: "3px solid #E67E22",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.1)"
                  }}></div>
                </div>

                {/* 편의시설 아이콘들 */}
                <div style={{
                  position: "absolute",
                  bottom: "40px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "10px",
                  fontSize: "1.2rem"
                }}>
                  <span title="무료 WiFi">📶</span>
                  <span title="커피 무료">☕</span>
                  <span title="휴식 공간">🛋️</span>
                  <span title="업무 공간">💻</span>
                </div>

                {/* 입구 표시 */}
                <div style={{
                  position: "absolute",
                  bottom: "0px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  animation: "pulse 2s infinite"
                }}>
                  <div style={{
                    fontSize: "1.2rem",
                    color: "#e74c3c"
                  }}>🔽</div>
                  <span style={{
                    color: "#e74c3c",
                    fontWeight: "700",
                    fontSize: "0.7rem"
                  }}>입구</span>
                </div>
              </div>
            </div>
          </div>

          {/* 룸 타입 가이드 - 수정: flex로 1줄로 재배치 */}
          <div style={{
            marginTop: "3rem",
            background: "rgba(255,255,255,0.95)",
            borderRadius: "20px",
            padding: "2.5rem",
            boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)"
          }}>
            <h4 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#2c3e50",
              marginBottom: "2rem",
              textAlign: "center"
            }}>
              룸 타입 가이드
            </h4>
            <div style={{
              display: "flex", // Changed to flex for single row
              gap: "1rem",
              justifyContent: "space-between" // Distribute items evenly
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
                borderRadius: "15px",
                color: "white",
                boxShadow: "0 8px 20px rgba(255, 107, 53, 0.3)",
                flex: "1" // Allow flexible growth
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  👥
                </div>
                <div>
                  <h5 style={{
                    fontWeight: "600",
                    fontSize: "1.1rem",
                    margin: "0 0 0.5rem 0"
                  }}>
                    4인실 프리미엄
                  </h5>
                  <p style={{
                    fontSize: "0.9rem",
                    opacity: 0.9,
                    margin: 0
                  }}>
                    대형 회의테이블, 4K 모니터, 화상회의 시설
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #4CC9F0 0%, #7209B7 100%)",
                borderRadius: "15px",
                color: "white",
                boxShadow: "0 8px 20px rgba(76, 201, 240, 0.3)",
                flex: "1" // Allow flexible growth
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  👫
                </div>
                <div>
                  <h5 style={{
                    fontWeight: "600",
                    fontSize: "1.1rem",
                    margin: "0 0 0.5rem 0"
                  }}>
                    2인실 스탠다드
                  </h5>
                  <p style={{
                    fontSize: "0.9rem",
                    opacity: 0.9,
                    margin: 0
                  }}>
                    듀얼 모니터, 에르고노믹 의자, 개인 사물함
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #9D4EDD 0%, #6A0572 100%)",
                borderRadius: "15px",
                color: "white",
                boxShadow: "0 8px 20px rgba(157, 78, 221, 0.3)",
                flex: "1" // Allow flexible growth
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px"
                }}>
                  👤
                </div>
                <div>
                  <h5 style={{
                    fontWeight: "600",
                    fontSize: "1.1rem",
                    margin: "0 0 0.5rem 0"
                  }}>
                    1인실 프라이빗
                  </h5>
                  <p style={{
                    fontSize: "0.9rem",
                    opacity: 0.9,
                    margin: 0
                  }}>
                    개인 데스크, 조명 조절, 집중형 환경
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 예약 확인 팝업 - CommonPopup 비즈니스 로직 유지 */}
      <CommonPopup
        show={showPopup}
        onHide={handleCancel}
        onConfirm={handleConfirm}
        title="🏢 예약 확인"
      >
        {selectedRoom && (
          <div style={{ 
            fontSize: "var(--bs-body-font-size, 1rem)",
            lineHeight: 1.6
          }}>
            <div style={{ 
              textAlign: "center", 
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "12px",
              color: "white"
            }}>
              <h4 style={{ 
                margin: "0 0 0.5rem 0",
                fontSize: "1.3rem",
                fontWeight: "600"
              }}>
                {selectedRoom.label}
              </h4>
              <p style={{ margin: 0, opacity: 0.9 }}>
                {selectedRoom.type} • {selectedRoom.capacity}명 • ₩{selectedRoom.price.toLocaleString()}
              </p>
            </div>

            <div style={{ 
              background: "#f8f9fa", 
              padding: "1.5rem", 
              borderRadius: "10px",
              marginBottom: "1.5rem"
            }}>
              <h5 style={{ 
                margin: "0 0 1rem 0",
                color: "#2c3e50",
                fontSize: "1rem",
                fontWeight: "600"
              }}>
                📋 예약 정보 입력
              </h5>
              
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "#2c3e50"
                }}>
                  👤 이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={userInfo.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력하세요"
                  style={{
                    width: "100%",
                    padding: "calc(0.5rem * var(--bs-scaling, 1))",
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                    fontSize: "var(--bs-body-font-size, 1rem)",
                    transition: "border-color 0.3s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "#2c3e50"
                }}>
                  ⚥ 성별
                </label>
                <select
                  name="gender"
                  value={userInfo.gender}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "calc(0.5rem * var(--bs-scaling, 1))",
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                    fontSize: "var(--bs-body-font-size, 1rem)",
                    transition: "border-color 0.3s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                >
                  <option value="">성별을 선택하세요</option>
                  <option value="Male">남성</option>
                  <option value="Female">여성</option>
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "#2c3e50"
                }}>
                  📞 전화번호
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleInputChange}
                  placeholder="010-0000-0000"
                  style={{
                    width: "100%",
                    padding: "calc(0.5rem * var(--bs-scaling, 1))",
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                    fontSize: "var(--bs-body-font-size, 1rem)",
                    transition: "border-color 0.3s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "#2c3e50"
                }}>
                  📅 예약 날짜
                </label>
                <DatePicker
                  selected={userInfo.date}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="예약 날짜를 선택하세요"
                  style={{
                    width: "100%",
                    padding: "calc(0.5rem * var(--bs-scaling, 1))",
                    borderRadius: "8px",
                    border: "2px solid #e9ecef",
                    fontSize: "var(--bs-body-font-size, 1rem)",
                    transition: "border-color 0.3s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                  minDate={new Date()}
                  className="custom-datepicker"
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "1rem",
                  fontWeight: "500",
                  color: "#2c3e50"
                }}>
                  ⏰ 예약 기간
                </label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr 1fr", 
                  gap: "0.5rem" 
                }}>
                  {["1", "6", "12"].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => handleDurationClick(duration)}
                      style={{
                        padding: "calc(0.75rem * var(--bs-scaling, 1))",
                        background: userInfo.duration === duration 
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                          : "#f8f9fa",
                        color: userInfo.duration === duration ? "white" : "#2c3e50",
                        border: userInfo.duration === duration 
                          ? "2px solid #667eea" 
                          : "2px solid #e9ecef",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "var(--bs-body-font-size, 1rem)",
                        fontWeight: "500",
                        transition: "all 0.3s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (userInfo.duration !== duration) {
                          e.target.style.background = "#e9ecef";
                          e.target.style.borderColor = "#667eea";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (userInfo.duration !== duration) {
                          e.target.style.background = "#f8f9fa";
                          e.target.style.borderColor = "#e9ecef";
                        }
                      }}
                    >
                      {duration}개월
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ 
              background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", 
              padding: "1.5rem", 
              borderRadius: "10px",
              marginBottom: "1rem"
            }}>
              <h5 style={{ 
                margin: "0 0 1rem 0",
                color: "#2c3e50",
                fontSize: "1rem",
                fontWeight: "600"
              }}>
                ✨ 포함 시설 & 혜택
              </h5>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem"
              }}>
                {selectedRoom.amenities.map((amenity, index) => (
                  <div key={index} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span style={{ color: "#27ae60", fontSize: "1rem" }}>✓</span>
                    <span style={{ 
                      fontSize: "0.9rem",
                      color: "#2c3e50"
                    }}>
                      {amenity}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span style={{ color: "#27ae60", fontSize: "1rem" }}>✓</span>
                  <span style={{ 
                    fontSize: "0.9rem",
                    color: "#2c3e50"
                  }}>
                    무료 WiFi
                  </span>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span style={{ color: "#27ae60", fontSize: "1rem" }}>✓</span>
                  <span style={{ 
                    fontSize: "0.9rem",
                    color: "#2c3e50"
                  }}>
                    카페 라운지 이용
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CommonPopup>

      {/* [수정] <style jsx>를 <style>로 변경하여 JSX 속성 오류 수정 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .custom-datepicker {
          width: 100%;
          padding: calc(0.5rem * var(--bs-scaling, 1));
          border-radius: 8px;
          border: 2px solid #e9ecef;
          font-size: var(--bs-body-font-size, 1rem);
          transition: border-color 0.3s ease;
        }
        .custom-datepicker:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 5px rgba(102, 126, 234, 0.5);
        }
        label {
          font-weight: 500;
          margin-bottom: calc(0.25rem * var(--bs-scaling, 1));
          display: block;
          color: #2c3e50;
        }
      `}</style>
    </div>
  );
};

export default Reservation3;