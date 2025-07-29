import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import api from "../../utils/api";
import common from "../../utils/common";
import { errorMsgPopup } from "../../utils/errorMsgPopup";
import styles from "../../components/table/TableSearch.module.css";

// 한글 주석: 호실 상태에 따른 색상 반환 함수
const getRoomColor = (availableCount, totalCount) => {
  const ratio = totalCount > 0 ? availableCount / totalCount : 0;
  if (ratio === 0) return "#f28c82"; // 공실 없음: 부드러운 레드
  if (ratio === 1) return "#a3bffa"; // 모두 공실: 부드러운 파란 회색
  return `linear-gradient(to right, #f28c82 ${(1 - ratio) * 100}%, #a3bffa ${ratio * 100}%)`; // 부드러운 그라디언트
};

// 한글 주석: 호실 유형별 색상 정의
const roomTypeStyles = {
  "1인실": { color: "#a3bffa" }, // 부드러운 파란 회색
  "2인실": { color: "#f7b267" }, // 부드러운 오렌지
  "4인실": { color: "#a3bffa" }, // 부드러운 파란 회색
  "8인실": { color: "#f28c82" }, // 부드러운 레드
};

// 한글 주석: 배경에 따른 텍스트 색상 반환 함수
const getTextColor = (backgroundColor) => {
  const isDarkBackground = backgroundColor.includes("#f28c82") && backgroundColor.indexOf("#a3bffa") < 0;
  return isDarkBackground ? "#fff" : "#1e293b"; // 빨간색 배경: 흰색, 파란색 배경: 어두운 회색
};

const ReservationBuilding = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationData, setReservationData] = useState([]);
  const [layoutData, setLayoutData] = useState([]);

  // 한글 주석: 권한 체크
  useEffect(() => {
    if (!user || !hasPermission(user.auth, "reservationView")) {
      console.log("사용자 또는 예약 조회 권한이 없어 리다이렉트합니다.");
      navigate("/");
    }
  }, [user, navigate]);

  // 한글 주석: 층 및 레이아웃 데이터 로드
  const loadFloors = async () => {
    setLoading(true);
    try {
      const response = await api.post(common.getServerUrl("reservation/layout/list"), {
        FLOOR_ID: "",
        SECTION: "",
        DEBUG: "F",
      });
      if (response.data.success && Array.isArray(response.data.data)) {
        setLayoutData(response.data.data);
        const floorList = [...new Set(response.data.data.map((item) => item.FLOOR_ID))].sort((a, b) => {
          const numA = parseInt(a.replace("F", ""));
          const numB = parseInt(b.replace("F", ""));
          return numB - numA; // 한글 주석: 내림차순 정렬 (3F, 2F, 1F)
        });
        setFloors(floorList);
      } else {
        errorMsgPopup(response.data.errMsg || "층 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("층 데이터 로드 실패:", error);
      errorMsgPopup("층 데이터를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 한글 주석: 예약 데이터 로드
  const loadReservationData = async () => {
    try {
      const params = {
        p_NAME: "",
        p_STATUS: "",
        p_FLOOR_ID: "",
        p_SECTION: "",
        p_DEBUG: "F",
      };
      const response = await api.post(common.getServerUrl("reservation/reservation/list"), params);
      if (response.data.success && Array.isArray(response.data.data)) {
        setReservationData(
          response.data.data.map((row) => ({
            ROOM_ID: row.ROOM_ID,
            FLOOR_ID: row.FLOOR_ID,
            SECTION: row.SECTION,
            STATUS: row.STATUS === "승인완료" ? "사용 중" : row.STATUS,
          }))
        );
      } else {
        errorMsgPopup(response.data.errMsg || "예약 데이터를 가져오는 중 오류가 발생했습니다.");
        setReservationData([]);
      }
    } catch (error) {
      console.error("예약 데이터 로드 실패:", error);
      errorMsgPopup("예약 데이터를 가져오는 중 오류가 발생했습니다.");
      setReservationData([]);
    }
  };

  // 한글 주석: 초기 데이터 로드
  useEffect(() => {
    loadFloors();
    loadReservationData();
  }, []);

  // 한글 주석: 층 클릭 시 ReservationMain으로 이동
  const handleFloorClick = (floor) => {
    sessionStorage.setItem("selectedFloorId", floor);
    const targetPath = "/reservation/ReservationMain";
    console.log("이동 경로:", targetPath, "선택된 층:", floor);
    navigate(targetPath, { replace: true });
  };

  // 한글 주석: 호실 유형 분포 계산 (총 개수 및 공실 개수)
  const getRoomTypeDistribution = (sectionRooms) => {
    const distribution = {
      "1인실": { total: 0, available: 0 },
      "2인실": { total: 0, available: 0 },
      "4인실": { total: 0, available: 0 },
      "8인실": { total: 0, available: 0 },
    };
    sectionRooms.forEach((room) => {
      if (room && room.ROOM_TYPE) {
        const roomType = room.ROOM_TYPE;
        distribution[roomType].total += 1;
        const isAvailable = !reservationData.some((res) => res.ROOM_ID === room.ROOM_ID && res.STATUS === "사용 중");
        if (isAvailable) distribution[roomType].available += 1;
      }
    });
    return distribution;
  };

  // 한글 주석: 층/섹션별 공실 요약 계산
  const floorSummaries = useMemo(() => {
    return floors.reduce((acc, floor) => {
      const floorLayout = layoutData.filter((item) => item.FLOOR_ID === floor);
      const totalRooms = floorLayout.length;
      const usedRooms = reservationData.filter((res) => res.FLOOR_ID === floor && res.STATUS === "사용 중").length;
      const availableRooms = totalRooms - usedRooms;
      const sections = ["A", "B", "C"].reduce((sectionAcc, section) => {
        const sectionLayout = floorLayout.filter((item) => item.SECTION === section);
        const totalSectionRooms = sectionLayout.length;
        const usedSectionRooms = reservationData.filter(
          (res) => res.FLOOR_ID === floor && res.SECTION === section && res.STATUS === "사용 중"
        ).length;
        const availableSectionRooms = totalSectionRooms - usedSectionRooms;
        const roomTypes = getRoomTypeDistribution(sectionLayout);
        return {
          ...sectionAcc,
          [section]: { totalSectionRooms, availableSectionRooms, roomTypes },
        };
      }, {});
      return { ...acc, [floor]: { totalRooms, availableRooms, sections } };
    }, {});
  }, [floors, layoutData, reservationData]);

  if (loading) {
    return <div style={{ color: "#d4af37", textAlign: "center", padding: "2rem" }}>로딩 중...</div>;
  }

  return (
    <div
      className={styles.container}
      style={{
        padding: "2rem",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #0e141f 100%)",
        fontFamily: "'Noto Sans KR', sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        width: "100vw",
        margin: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1920px",
          height: "calc(100vh - 4rem)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* 한글 주석: 좌측 빌딩 구조 (변경 없음, 층 역순 정렬 적용) */}
        <div
          style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 2rem",
            width: "50%",
            overflow: "hidden",
          }}
        >
          <h2 style={{ color: "#d4af37", fontSize: "2rem", marginBottom: "2rem", textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}>
            두바이 63 빌딩
          </h2>
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              width: "100%",
              maxHeight: "calc(100vh - 150px)",
              overflowY: "auto",
              paddingRight: "0.5rem",
              scrollbarWidth: "thin",
              scrollbarColor: "#4a5568 #2d3748",
            }}
            className="custom-scrollbar"
          >
            <style>
              {`.custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #2d3748;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4a5568;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #718096;
              }
              .building-layer {
                position: relative;
                width: 100%;
                max-width: 600px;
                height: 250px;
                background: linear-gradient(135deg, #4a5568 0%, #2d3748 70%, rgba(255,255,255,0.1) 100%);
                border: 2px solid #d4af37;
                border-radius: 12px;
                box-shadow: 0 6px 12px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 1.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }
              .building-layer:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.4), inset 0 0 15px rgba(255,255,255,0.2);
              }
              .top-layer, .bottom-layer {
                height: 280px;
                background: linear-gradient(135deg, #a3bffa 0%, #718096 70%, rgba(255,255,255,0.1) 100%);
              }`}
            </style>
            <div className="building-layer top-layer" style={{ border: "2px solid #d4af37" }}>
              옥상
            </div>
            {floors.map((floor) => (
              <div
                key={floor}
                className="building-layer"
                onClick={() => handleFloorClick(floor)}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-4px)";
                  e.target.style.boxShadow = "0 10px 20px rgba(0,0,0,0.4), inset 0 0 15px rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.1)";
                }}
              >
                {floor}
              </div>
            ))}
            <div className="building-layer bottom-layer" style={{ border: "2px solid #d4af37" }}>
              입구/주차장
            </div>
          </div>
        </div>

        {/* 한글 주석: 우측 공실 현황 (범례를 제목 옆으로, 셀에 경계선 추가) */}
        <div
          style={{
            flex: "0 0 50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 2rem",
            width: "50%",
            overflow: "hidden",
          }}
        >
          <h2 style={{ color: "#d4af37", fontSize: "1.8rem", marginBottom: "1rem", textShadow: "1px 1px 3px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              공실 현황
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "12px", height: "12px", background: "#a3bffa", borderRadius: "2px" }}></span>
                  <span style={{ color: "#fff", fontSize: "0.8rem" }}>예약 가능</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "12px", height: "12px", background: "#f28c82", borderRadius: "2px" }}></span>
                  <span style={{ color: "#fff", fontSize: "0.8rem" }}>사용 중</span>
                </div>
              </div>
            </div>
          </h2>
          <div
            style={{
              flex: "1",
              width: "100%",
              maxWidth: "650px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 7rem)",
              padding: "0 0 1rem",
              paddingRight: "0.5rem",
              scrollbarWidth: "thin",
              scrollbarColor: "#4a5568 #2d3748",
            }}
            className="custom-scrollbar"
          >
            <style>
              {`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #2d3748;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #4a5568;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #718096;
                }
                .tooltip {
                  position: absolute;
                  background: rgba(31,41,55,0.9);
                  color: #fff;
                  padding: 0.6rem 0.8rem;
                  border-radius: 6px;
                  border: 1px solid #4a5568;
                  font-size: 0.85rem;
                  z-index: 10;
                  display: none;
                  white-space: nowrap;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                }
                td:hover .tooltip {
                  display: block;
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                .room-type-row {
                  display: flex;
                  align-items: center;
                  gap: 0.4rem;
                  margin: 0.2rem 0;
                }
              `}
            </style>
            {floors.length === 0 && (
              <div style={{ color: "#d4af37", textAlign: "center", padding: "1rem", fontSize: "1rem" }}>데이터가 없습니다.</div>
            )}
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#2d3748", color: "#d4af37" }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "1rem", border: "1px solid #4a5568" }}>층</th>
                  <th style={{ padding: "1rem", textAlign: "center", fontSize: "1rem", border: "1px solid #4a5568" }}>A 섹션</th>
                  <th style={{ padding: "1rem", textAlign: "center", fontSize: "1rem", border: "1px solid #4a5568" }}>B 섹션</th>
                  <th style={{ padding: "1rem", textAlign: "center", fontSize: "1rem", border: "1px solid #4a5568" }}>C 섹션</th>
                </tr>
              </thead>
              <tbody>
                {floors.map((floor) => {
                  const { sections } = floorSummaries[floor];
                  return (
                    <tr key={floor}>
                      <td style={{ padding: "1rem", color: "#fff", fontSize: "0.95rem", fontWeight: "500", border: "1px solid #4a5568" }}>
                        {floor}
                      </td>
                      {["A", "B", "C"].map((section) => {
                        const { totalSectionRooms, availableSectionRooms, roomTypes } = sections[section];
                        const roomTypeText = Object.entries(roomTypes)
                          .filter(([_, { total }]) => total > 0)
                          .map(([type]) => (
                            <div key={type} className="room-type-row" style={{ color: roomTypeStyles[type].color }}>
                              <span style={{ fontSize: "0.95rem" }}>{type}: 예약 가능</span>
                            </div>
                          ));
                        const roomTypeSummary = Object.entries(roomTypes)
                          .filter(([_, { total }]) => total > 0)
                          .map(([type, { available, total }]) => {
                            const status = available === 0 ? "사용 중" : "예약 가능";
                            const textColor = getTextColor(getRoomColor(availableSectionRooms, totalSectionRooms));
                            return (
                              <div
                                key={type}
                                className="room-type-row"
                                style={{ color: textColor, textShadow: "0 1px 2px rgba(0,0,0,0.5)", fontWeight: 500, lineHeight: "1.2" }}
                              >
                                <span style={{ fontSize: "0.95rem" }}>
                                  {type}: {status}
                                </span>
                              </div>
                            );
                          });
                        return (
                          <td
                            key={`${floor}-${section}`}
                            style={{
                              padding: "1rem",
                              textAlign: "center",
                              background: getRoomColor(availableSectionRooms, totalSectionRooms),
                              position: "relative",
                              verticalAlign: "middle",
                              border: "1px solid #4a5568",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              {roomTypeSummary.length > 0 ? (
                                roomTypeSummary
                              ) : (
                                <span style={{ color: "#d4af37", fontSize: "0.85rem", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                  호실 없음
                                </span>
                              )}
                            </div>
                            <div className="tooltip">{roomTypeText.length > 0 ? roomTypeText : "호실 없음"}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationBuilding;
