/**
 * ReservationMain.jsx
 * 설명: 사용자 페이지에서 예약 정보를 조회하고 새 예약을 등록하는 React 컴포넌트
 * 수정일: 2025-07-23
 * 수정 내용: 예약 데이터가 tb_reservation 테이블과 동기화되도록 handleConfirm 수정, 날짜 및 추가 컬럼 처리 추가
 * 추가 수정: 사용중/사용불가/예약가능/예약불가 상태 표시, 툴팁 및 상태 범례 추가, 사용중/예약불가/사용불가 룸 회색 처리
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import CommonPopup from "../../components/popup/CommonPopup";
import DatePickerCommon from "../../components/common/DatePickerCommon";
import api from "../../utils/api";
import common from "../../utils/common";
import bathroomImage from "../../assets/images/bathroom.jpg";
import loungeImage from "../../assets/images/lounge.jpg";
import faxPrinterImage from "../../assets/images/fax_printer.jpg";

// 한글 주석: ROOM_TYPE을 서버 형식으로 매핑하는 함수
const mapRoomTypeToServer = (roomType) => {
  const roomTypeMap = {
    "1인실": "1인실",
    "2인실": "2인실",
    "4인실": "4인실",
    "8인실": "8인실",
    프리미엄: "PREMIUM",
  };
  return roomTypeMap[roomType] || "1인실"; // 기본값 1인실
};

// 한글 주석: 전화번호에서 하이픈을 제거하여 서버 형식으로 변환하는 함수
const formatPhoneForServer = (phone) => {
  return phone.replace(/-/g, ""); // 하이픈 제거
};

// 한글 주석: 선택된 층에 따라 레이아웃 데이터를 조회하고 방 목록을 동적으로 생성하며 모든 섹션 슬롯을 채우는 함수
const fetchLayoutData = async (selectedFloor) => {
  try {
    const response = await api.post(common.getServerUrl("reservation/layout/list"), {
      p_FLOOR_ID: selectedFloor,
      p_SECTION: "",
      p_DEBUG: "F",
    });
    if (response.data.success && Array.isArray(response.data.data)) {
      const roomSizeMap = { "1인실": 1, "2인실": 2, "4인실": 4, "8인실": 8, PREMIUM: 1 };
      const generatedRooms = [];

      const defaultConfig = { slotsPerSection: 8, layoutAdjustment: 1.0 };
      const floorConfig = response.data.data.reduce((acc, layout) => {
        if (!acc[layout.p_FLOOR_ID || layout.FLOOR_ID]) {
          acc[layout.p_FLOOR_ID || layout.FLOOR_ID] = {
            slotsPerSection: parseInt(layout.p_SLOTS_PER_SECTION) || defaultConfig.slotsPerSection,
            layoutAdjustment: parseFloat(layout.p_LAYOUT_ADJUSTMENT) || defaultConfig.layoutAdjustment,
          };
        }
        return acc;
      }, {});
      const config = floorConfig[selectedFloor] || defaultConfig;

      const layoutsBySection = response.data.data.reduce(
        (acc, layout) => {
          const section = layout.p_SECTION || layout.SECTION || "A";
          if (!acc[section]) acc[section] = [];
          acc[section].push(layout);
          return acc;
        },
        { A: [], B: [], C: [] }
      );

      for (const section in layoutsBySection) {
        const layouts = layoutsBySection[section];
        const roomPositions = Array(config.slotsPerSection).fill(null);
        const sectionRooms = [];

        layouts.sort((a, b) => parseInt(a.p_ROOM_INDEX || a.ROOM_INDEX || 1) - parseInt(b.p_ROOM_INDEX || b.ROOM_INDEX || 1));

        layouts.forEach((layout) => {
          const size = roomSizeMap[layout.p_ROOM_TYPE || layout.ROOM_TYPE || "1인실"] || 1;
          const roomIndex = parseInt(layout.p_ROOM_INDEX || layout.ROOM_INDEX || 1) - 1;
          let startIndex = -1;

          const baseWidth = 8 * config.layoutAdjustment;
          const baseHeight = 2.4 * config.layoutAdjustment;
          let width, height;

          if (size === 8) {
            width = 16 * config.layoutAdjustment;
            height = 4 * baseHeight;
            startIndex = 0;
            if (roomPositions.every((pos) => pos === null)) {
              const room = {
                id: layout.p_ROOM_ID || layout.ROOM_ID || `room-${section}-1`,
                label: `${selectedFloor}${section}${layout.p_ROOM_INDEX || layout.ROOM_INDEX || 1}`,
                type: layout.p_ROOM_TYPE || layout.ROOM_TYPE || "8인실",
                capacity: 8,
                price: parseInt(layout.p_PRICE || layout.PRICE || 1500000) || 1500000,
                amenities: ["8K 모니터", "화상회의 시설", "프리미엄 의자", "화이트보드", "프로젝터"],
                x: 0,
                y: 0,
                width,
                height,
                color: "#FF6B35",
                status: "예약가능",
                floor: layout.p_FLOOR_ID || layout.FLOOR_ID || selectedFloor,
                SECTION: section,
                size: size,
              };
              sectionRooms.push(room);
              roomPositions.fill(room);
            }
          } else if (size === 4) {
            width = 16 * config.layoutAdjustment;
            height = 2 * baseHeight;
            if (
              roomIndex >= 0 &&
              roomIndex <= Math.floor(config.slotsPerSection / 2) &&
              roomPositions[roomIndex] === null &&
              roomPositions[roomIndex + 1] === null &&
              roomPositions[roomIndex + 2] === null &&
              roomPositions[roomIndex + 3] === null
            ) {
              startIndex = roomIndex;
            } else {
              for (let i = 0; i <= Math.floor(config.slotsPerSection / 2); i++) {
                if (
                  roomPositions[i] === null &&
                  roomPositions[i + 1] === null &&
                  roomPositions[i + 2] === null &&
                  roomPositions[i + 3] === null
                ) {
                  startIndex = i;
                  break;
                }
              }
            }
            if (startIndex !== -1) {
              const room = {
                id: layout.p_ROOM_ID || layout.ROOM_ID || `room-${section}-${roomIndex + 1}`,
                label: `${selectedFloor}${section}${layout.p_ROOM_INDEX || layout.ROOM_INDEX || roomIndex + 1}`,
                type: layout.p_ROOM_TYPE || layout.ROOM_TYPE || "4인실",
                capacity: 4,
                price: parseInt(layout.p_PRICE || layout.PRICE || 800000) || 800000,
                amenities: ["4K 모니터", "화상회의 시설", "프리미엄 의자"],
                x: (startIndex % 2) * baseWidth,
                y: Math.floor(startIndex / 2) * baseHeight,
                width,
                height,
                color: "#2ecc71",
                status: "예약가능",
                floor: layout.p_FLOOR_ID || layout.FLOOR_ID || selectedFloor,
                SECTION: section,
                size: size,
              };
              sectionRooms.push(room);
              for (let i = startIndex; i < startIndex + 4; i++) roomPositions[i] = room;
            }
          } else if (size === 2) {
            width = 16 * config.layoutAdjustment;
            height = baseHeight;
            if (
              roomIndex >= 0 &&
              roomIndex < config.slotsPerSection - 1 &&
              roomPositions[roomIndex] === null &&
              roomPositions[roomIndex + 1] === null
            ) {
              startIndex = roomIndex;
            } else {
              for (let i = 0; i < config.slotsPerSection - 1; i += 2) {
                if (roomPositions[i] === null && roomPositions[i + 1] === null) {
                  startIndex = i;
                  break;
                }
              }
            }
            if (startIndex !== -1) {
              const room = {
                id: layout.p_ROOM_ID || layout.ROOM_ID || `room-${section}-${roomIndex + 1}`,
                label: `${selectedFloor}${section}${layout.p_ROOM_INDEX || layout.ROOM_INDEX || roomIndex + 1}`,
                type: layout.p_ROOM_TYPE || layout.ROOM_TYPE || "2인실",
                capacity: 2,
                price: parseInt(layout.p_PRICE || layout.PRICE || 400000) || 400000,
                amenities: ["4K 모니터", "프리미엄 의자"],
                x: (startIndex % 2) * baseWidth,
                y: Math.floor(startIndex / 2) * baseHeight,
                width,
                height,
                color: "#e74c3c",
                status: "예약가능",
                floor: layout.p_FLOOR_ID || layout.FLOOR_ID || selectedFloor,
                SECTION: section,
                size: size,
              };
              sectionRooms.push(room);
              roomPositions[startIndex] = room;
              roomPositions[startIndex + 1] = room;
            }
          } else if (size === 1) {
            width = baseWidth;
            height = baseHeight;
            if (roomIndex >= 0 && roomIndex < config.slotsPerSection && roomPositions[roomIndex] === null) {
              startIndex = roomIndex;
            } else {
              for (let i = 0; i < config.slotsPerSection; i++) {
                if (roomPositions[i] === null) {
                  startIndex = i;
                  break;
                }
              }
            }
            if (startIndex !== -1) {
              const room = {
                id: layout.p_ROOM_ID || layout.ROOM_ID || `room-${section}-${roomIndex + 1}`,
                label: `${selectedFloor}${section}${layout.p_ROOM_INDEX || layout.ROOM_INDEX || roomIndex + 1}`,
                type: layout.p_ROOM_TYPE || layout.ROOM_TYPE || "1인실",
                capacity: 1,
                price: parseInt(layout.p_PRICE || layout.PRICE || 200000) || 200000,
                amenities: ["모니터", "기본 의자"],
                x: (startIndex % 2) * baseWidth,
                y: Math.floor(startIndex / 2) * baseHeight,
                width,
                height,
                color: "#3498db",
                status: "예약가능",
                floor: layout.p_FLOOR_ID || layout.FLOOR_ID || selectedFloor,
                SECTION: section,
                size: size,
              };
              sectionRooms.push(room);
              roomPositions[startIndex] = room;
            }
          }
        });

        for (let i = 0; i < config.slotsPerSection; i++) {
          if (roomPositions[i] === null) {
            sectionRooms.push({
              id: `empty-${section}-${i}`,
              label: "빈 공간",
              type: "empty",
              capacity: 0,
              price: 0,
              amenities: [],
              x: (i % 2) * baseWidth,
              y: Math.floor(i / 2) * baseHeight,
              width: baseWidth,
              height: baseHeight,
              color: "#e5e7eb",
              status: "empty",
              SECTION: section,
              size: 1,
            });
            roomPositions[i] = { id: `empty-${section}-${i}` };
          }
        }

        generatedRooms.push(...sectionRooms);
      }

      return generatedRooms;
    } else {
      console.warn("유효한 레이아웃 데이터 없음:", response.data.message || "데이터 없음");
      return [];
    }
  } catch (error) {
    console.error("레이아웃 데이터 가져오기 실패:", error);
    alert("레이아웃 데이터를 가져오는 중 오류가 발생했습니다.");
    return [];
  }
};

const ReservationMain = () => {
  const { user } = useStore();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [reservedRooms, setReservedRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [userInfo, setUserInfo] = useState({
    reservationId: "",
    roomId: "",
    roomType: "",
    name: "",
    gender: "",
    phone: "",
    startDate: "",
    duration: "",
    extensionStatus: "없음",
    approvalStatus: "승인대기",
    price: 0,
    empId: "",
    note: "",
  });
  const [selectedFloor, setSelectedFloor] = useState(null);
  // 한글 주석: 예약 상세 정보 저장 (툴팁용)
  const [reservationDetails, setReservationDetails] = useState({});

  // 한글 주석: 예약 데이터를 서버에서 가져와 상태를 업데이트하는 함수 (수정: 상태 및 툴팁 정보 추가)
  const fetchReservations = async (generatedRooms) => {
    try {
      const floorId = selectedFloor || "1F";
      const section = selectedRoom ? selectedRoom.SECTION : "";

      const requestData = {
        p_NAME: null,
        p_STATUS: null,
        p_FLOOR_ID: floorId,
        p_SECTION: section,
        p_EXTENSION_STATUS: "",
        p_APPROVAL_STATUS: "",
        p_DEBUG: "F",
      };

      const response = await api.post(common.getServerUrl("reservation/reservation/list"), requestData);

      // console.log("서버 응답:", response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        const reservedRoomData = response.data.data.reduce((acc, reservation) => {
          let status;
          if (reservation.APPROVAL_STATUS === "승인완료") {
            status = "사용중";
          } else if (reservation.APPROVAL_STATUS === "승인대기") {
            status = "예약불가";
          } else if (reservation.STATUS === "사용불가") {
            status = "사용불가";
          } else {
            status = "예약가능";
          }
          acc[reservation.ROOM_ID] = {
            status,
            name: reservation.NAME,
            startDate: reservation.START_DATE,
            endDate: reservation.END_DATE,
            reason: reservation.REASON || "유지보수 중", // 사용불가 사유 (서버에서 제공 안 될 경우 기본값)
          };
          return acc;
        }, {});
        const reservedRoomIds = Object.keys(reservedRoomData);
        setReservedRooms(reservedRoomIds);
        setReservationDetails(reservedRoomData);
        const updatedRooms = generatedRooms.map((room) => ({
          ...room,
          status: reservedRoomIds.includes(room.id) ? reservedRoomData[room.id].status : room.type === "empty" ? "empty" : "예약가능",
        }));
        setRooms(updatedRooms);
      } else if (response.data.errCd === "01" && response.data.errMsg === "조회된 예약 정보가 없습니다.") {
        console.log("예약 데이터가 없습니다. 모든 방을 '예약가능'으로 설정합니다.");
        const updatedRooms = generatedRooms.map((room) => ({
          ...room,
          status: room.type === "empty" ? "empty" : "예약가능",
        }));
        setRooms(updatedRooms);
        setReservedRooms([]);
        setReservationDetails({});
      } else {
        // console.warn("예상치 못한 응답:", response.data.errMsg || "데이터 없음");
        const updatedRooms = generatedRooms.map((room) => ({
          ...room,
          status: room.type === "empty" ? "empty" : "예약가능",
        }));
        setRooms(updatedRooms);
        setReservedRooms([]);
        setReservationDetails({});
      }
    } catch (error) {
      console.error("예약 데이터 가져오기 실패:", error.response?.data || error.message);
      console.log("요청 데이터:", requestData);
      alert("예약 데이터를 가져오는 중 오류가 발생했습니다: " + (error.response?.data?.errMsg || error.message));
      const updatedRooms = generatedRooms.map((room) => ({
        ...room,
        status: room.type === "empty" ? "empty" : "예약가능",
      }));
      setRooms(updatedRooms);
      setReservedRooms([]);
      setReservationDetails({});
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.post(common.getServerUrl("reservation/layout/list"), { p_FLOOR_ID: "", p_SECTION: "", p_DEBUG: "F" });
        if (response.data.success && Array.isArray(response.data.data)) {
          const floorList = [...new Set(response.data.data.map((item) => item.p_FLOOR_ID || item.FLOOR_ID))].sort((a, b) => {
            const numA = parseInt(a.replace("F", ""));
            const numB = parseInt(b.replace("F", ""));
            return numA - numB;
          });
          setFloors(floorList);
          if (!selectedFloor && floorList.length > 0) setSelectedFloor(floorList[0]);
        }
      } catch (error) {
        console.error("Failed to fetch floors:", error);
        alert("층 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFloor) {
      const loadFloorData = async () => {
        try {
          const generatedRooms = await fetchLayoutData(selectedFloor);
          if (generatedRooms && Array.isArray(generatedRooms)) {
            await fetchReservations(generatedRooms);
          } else {
            console.warn("generatedRooms가 유효하지 않습니다:", generatedRooms);
            setRooms([]);
            setReservedRooms([]);
            setReservationDetails({});
          }
        } catch (error) {
          console.error("층 데이터 로드 실패:", error);
          alert("층 데이터를 로드하는 중 오류가 발생했습니다.");
          setRooms([]);
          setReservedRooms([]);
          setReservationDetails({});
        }
      };
      loadFloorData();
    }
  }, [selectedFloor, useStore.getState().layoutUpdated]);

  useEffect(() => {
    if (!user || !hasPermission(user.auth, "reservationCreate")) navigate("/");
  }, [user, navigate]);

  const getStatistics = () => {
    const actualRooms = rooms.filter((room) => room.floor === selectedFloor && room.type !== "empty");
    const uniqueRooms = [...new Set(actualRooms.map((room) => room.id))];
    const totalRooms = uniqueRooms.length;
    const availableRooms = actualRooms.filter((room) => room.status === "예약가능").length;
    const reservedRoomsCount = actualRooms.filter((room) => room.status === "사용중" || room.status === "예약불가").length;
    const unavailableRoomsCount = actualRooms.filter((room) => room.status === "사용불가").length;
    const occupancyRate = totalRooms > 0 ? Math.round((reservedRoomsCount / totalRooms) * 100) : 0;
    return {
      totalRooms,
      availableRooms,
      reservedRooms: reservedRoomsCount,
      unavailableRooms: unavailableRoomsCount,
      occupancyRate,
      satisfactionRate: 98,
    };
  };

  const handleRoomClick = (room) => {
    if (room.status === "예약가능" && room.type !== "empty") {
      setSelectedRoom(room);
      setUserInfo({
        reservationId: `RES_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`,
        roomId: room.id,
        roomType: room.type,
        name: "",
        gender: "",
        phone: "",
        startDate: "",
        duration: "",
        extensionStatus: "없음",
        approvalStatus: "승인대기",
        price: room.price,
        empId: user?.empNo || "EMP001",
        note: "",
      });
      setShowPopup(true);
    } else if (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") {
      alert(`${room.label}은(는) ${room.status} 상태입니다.`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      startDate: value,
    }));
  };

  const handleDurationClick = (duration) => {
    if (!["1", "6", "12"].includes(duration)) {
      alert("예약 기간은 1, 6, 12개월 중 하나여야 합니다.");
      return;
    }
    setUserInfo((prev) => ({
      ...prev,
      duration,
    }));
  };

  const validateRoom = async () => {
    const response = await api.post(common.getServerUrl("reservation/layout/list"), {
      p_FLOOR_ID: selectedRoom.floor,
      p_SECTION: selectedRoom.SECTION,
      p_DEBUG: "F",
    });
    return response.data.success && response.data.data.some((layout) => (layout.p_ROOM_ID || layout.ROOM_ID) === selectedRoom.id);
  };

  const handleConfirm = async () => {
    console.log("userInfo:", userInfo); // 디버깅: 사용자 입력 정보
    console.log("selectedRoom:", selectedRoom); // 디버깅: 선택된 방 정보

    // 필수 입력값 검증
    if (!userInfo.name || !userInfo.gender || !userInfo.phone || !userInfo.startDate || !userInfo.duration) {
      alert("모든 필수 정보를 입력해주세요.");
      return;
    }
    if (!["남성", "여성"].includes(userInfo.gender)) {
      alert("성별은 남성 또는 여성만 선택 가능합니다.");
      return;
    }
    if (!userInfo.phone.match(/^\d{3}-\d{3,4}-\d{4}$/)) {
      alert("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }
    if (!["1", "6", "12"].includes(userInfo.duration)) {
      alert("예약 기간은 1, 6, 12개월 중 하나여야 합니다.");
      return;
    }

    // 전화번호 포맷팅 함수
    const formatPhoneForServer = (phone) => {
      const cleaned = phone.replace(/\D/g, ""); // 숫자만 추출
      if (cleaned.length === 11 && cleaned.startsWith("010")) {
        return `${cleaned.substr(0, 3)}-${cleaned.substr(3, 4)}-${cleaned.substr(7)}`; // 010-1234-5678
      }
      return phone; // 기존 형식이 맞으면 유지
    };

    // 방 유형 매핑 함수
    const mapRoomTypeToServer = (roomType) => {
      const typeMap = {
        "1인실": "1인실",
        "2인실": "2인실",
        "4인실": "4인실",
        "8인실": "8인실",
      };
      return typeMap[roomType] || "1인실"; // 기본값으로 '1인실' 설정
    };

    // 예약 요청 데이터 준비
    const requestData = {
      p_GUBUN: "I",
      p_RESERVATION_ID: userInfo.reservationId || null,
      p_ROOM_ID: selectedRoom.id,
      p_ROOM_TYPE: mapRoomTypeToServer(userInfo.roomType || selectedRoom.type),
      p_NAME: userInfo.name,
      p_GENDER: userInfo.gender,
      p_PHONE: formatPhoneForServer(userInfo.phone),
      p_START_DATE: userInfo.startDate,
      p_DURATION: parseInt(userInfo.duration),
      p_EXTENSION_STATUS: userInfo.extensionStatus || "없음",
      p_APPROVAL_STATUS: userInfo.approvalStatus || "승인대기",
      p_PRICE: Number(userInfo.price) || selectedRoom.price || 0,
      p_EMP_ID: userInfo.empId || "EMP001",
      p_NOTE: userInfo.note || "",
      p_DEBUG: "F",
    };

    console.log("Request data sent to server:", requestData); // 디버깅: 전송 데이터

    try {
      const response = await api.post(common.getServerUrl("reservation/reservation/save"), requestData);
      console.log("Server response:", response.data); // 디버깅: 서버 응답
      if (response.data.success && (!response.data.errMsg || response.data.errCd === "00")) {
        alert("예약이 성공적으로 완료되었습니다!");
        setUserInfo({
          reservationId: "",
          roomId: "",
          roomType: "",
          name: "",
          gender: "",
          phone: "",
          startDate: "",
          duration: "",
          extensionStatus: "없음",
          approvalStatus: "승인대기",
          price: 0,
          empId: "",
          note: "",
        });
        const generatedRooms = await fetchLayoutData(selectedFloor);
        if (generatedRooms && Array.isArray(generatedRooms)) {
          await fetchReservations(generatedRooms);
        }
        setShowPopup(false);
        setSelectedRoom(null);
      } else {
        console.error("Server error details:", response.data.errCd, response.data.errMsg);
        alert(
          `예약 처리 중 오류가 발생했습니다: ${response.data.errMsg || "알 수 없는 오류"} (에러 코드: ${response.data.errCd || "없음"})`
        );
      }
    } catch (error) {
      console.error("예약 요청 실패:", error.response?.data || error.message);
      alert(
        `예약 요청 중 오류가 발생했습니다: ${error.response?.data?.errMsg || error.message} (에러 코드: ${
          error.response?.data?.errCd || "없음"
        })`
      );
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
    setSelectedRoom(null);
    setUserInfo({
      reservationId: "",
      roomId: "",
      roomType: "",
      name: "",
      gender: "",
      phone: "",
      startDate: "",
      duration: "",
      extensionStatus: "없음",
      approvalStatus: "승인대기",
      price: 0,
      empId: "",
      note: "",
    });
  };

  const statistics = getStatistics();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: "0 auto",
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        fontFamily: "'Noto Sans KR', 'Roboto', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          padding: "1.2rem 0",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "2400px",
            margin: "0 auto",
            padding: "0 1.6rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)",
                borderRadius: "9.6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "19.2px",
                color: "#f8fafc",
                fontWeight: "bold",
              }}
            >
              🏢
            </div>
            <div>
              <h1
                style={{
                  color: "#f8fafc",
                  fontSize: "1.6rem",
                  fontWeight: "700",
                  margin: 0,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                (주) 시한432 오피스
              </h1>
              <p
                style={{
                  color: "#d4af37",
                  fontSize: "0.72rem",
                  margin: 0,
                  fontWeight: "400",
                }}
              >
                개지리는 N층#오피스
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span
              style={{
                color: "#d4af37",
                fontSize: "0.8rem",
                fontWeight: "500",
              }}
            >
              관리자
            </span>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(135deg, #d4af37, #ffd700)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f8fafc",
                fontWeight: "bold",
                fontSize: "0.8rem",
              }}
            >
              JB
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          padding: "2.4rem 1.6rem",
          flex: 1,
          display: "flex",
          flexDirection: "row",
          gap: "1.2rem",
          width: "100%",
          maxWidth: "2400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            flex: "0 0 20%",
            background: "linear-gradient(180deg, #1e293b 0%, #334155 100%)",
            padding: "1.6rem",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(212,175,55,0.3)",
            minHeight: "480px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ textAlign: "center", marginBottom: "1.6rem" }}>
              <select
                value={selectedFloor || ""}
                onChange={(e) => setSelectedFloor(e.target.value)}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "6.4px",
                  border: "1.6px solid #d4af37",
                  fontSize: "0.8rem",
                  background: "rgba(15,23,42,0.8)",
                  color: "#f8fafc",
                  cursor: "pointer",
                  width: "100%",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
                onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
              >
                <option value="" disabled>
                  층을 선택하세요
                </option>
                {floors.map((floor) => (
                  <option key={floor} value={floor} style={{ color: "#1e293b" }}>
                    {floor}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ textAlign: "center", marginBottom: "2.4rem" }}>
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "800",
                  color: "#d4af37",
                  textShadow: "1.6px 3.2px 9.6px rgba(0,0,0,0.3)",
                  marginBottom: "0.8rem",
                }}
              >
                {selectedFloor || "층 선택"} - 레이아웃
              </h2>
              <p
                style={{
                  fontSize: "0.96rem",
                  color: "#f8fafc",
                  maxWidth: "480px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                  opacity: 0.8,
                }}
              >
                공유 오피스 예약 현황을 한눈에 확인하세요.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "1.2rem",
                marginBottom: "2.4rem",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(255,215,0,0.1) 100%)",
                  padding: "1.6rem",
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: "0.8px solid rgba(212,175,55,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "9.6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19.2px",
                      color: "#d4af37",
                    }}
                  >
                    🏠
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#f8fafc",
                        margin: 0,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {statistics.totalRooms}
                    </p>
                    <p
                      style={{
                        color: "#d4af37",
                        fontSize: "0.8rem",
                        margin: 0,
                      }}
                    >
                      전체 룸
                    </p>
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  padding: "1.6rem",
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: "0.8px solid rgba(16,185,129,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "9.6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19.2px",
                      color: "#10b981",
                    }}
                  >
                    ✅
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#f8fafc",
                        margin: 0,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {statistics.availableRooms}
                    </p>
                    <p
                      style={{
                        color: "#10b981",
                        fontSize: "0.8rem",
                        margin: 0,
                      }}
                    >
                      이용 가능
                    </p>
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #8b5cf6 0%, #6b21a8 100%)",
                  padding: "1.6rem",
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: "0.8px solid rgba(139,92,246,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "9.6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19.2px",
                      color: "#8b5cf6",
                    }}
                  >
                    📊
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#f8fafc",
                        margin: 0,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {statistics.occupancyRate}%
                    </p>
                    <p
                      style={{
                        color: "#a78bfa",
                        fontSize: "0.8rem",
                        margin: 0,
                      }}
                    >
                      점유율
                    </p>
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  padding: "1.6rem",
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: "0.8px solid rgba(234,88,12,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "9.6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19.2px",
                      color: "#f59e0b",
                    }}
                  >
                    ⭐
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#f8fafc",
                        margin: 0,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {statistics.satisfactionRate}%
                    </p>
                    <p
                      style={{
                        color: "#f59e0b",
                        fontSize: "0.8rem",
                        margin: 0,
                      }}
                    >
                      만족도
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* 한글 주석: 상태 범례 추가 */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)",
                borderRadius: "16px",
                padding: "1.6rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                border: "1px solid rgba(212,175,55,0.3)",
                backdropFilter: "blur(8px)",
              }}
            >
              <h4
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "#d4af37",
                  marginBottom: "1.2rem",
                  textAlign: "center",
                }}
              >
                상태 가이드
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "1rem",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    ✅
                  </div>
                  <div>
                    <h5 style={{ fontSize: "0.96rem", fontWeight: "600", margin: "0 0 0.4rem 0" }}>예약가능</h5>
                    <p style={{ fontSize: "0.72rem", margin: 0, opacity: 0.9 }}>예약 가능한 룸</p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "1rem",
                    background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    🔒
                  </div>
                  <div>
                    <h5 style={{ fontSize: "0.96rem", fontWeight: "600", margin: "0 0 0.4rem 0" }}>사용중</h5>
                    <p style={{ fontSize: "0.72rem", margin: 0, opacity: 0.9 }}>현재 사용 중인 룸</p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "1rem",
                    background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    🚫
                  </div>
                  <div>
                    <h5 style={{ fontSize: "0.96rem", fontWeight: "600", margin: "0 0 0.4rem 0" }}>예약불가</h5>
                    <p style={{ fontSize: "0.72rem", margin: 0, opacity: 0.9 }}>예약 승인 대기 중</p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.8rem",
                    padding: "1rem",
                    background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    🛠
                  </div>
                  <div>
                    <h5 style={{ fontSize: "0.96rem", fontWeight: "600", margin: "0 0 0.4rem 0" }}>사용불가</h5>
                    <p style={{ fontSize: "0.72rem", margin: 0, opacity: 0.9 }}>유지보수 또는 기타 이유로 사용 불가</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: "1",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)",
            borderRadius: "20px",
            padding: "0.8rem",
            boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
            border: "2px solid rgba(212,175,55,0.2)",
            backdropFilter: "blur(15px)",
            minHeight: "480px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "0.4rem" }}>
            <p style={{ color: "#f8fafc", fontSize: "0.88rem", opacity: 0.7 }}>원하시는 공간을 클릭하여 예약하세요</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.2rem",
              flex: 1,
              overflow: "auto",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(255,215,0,0.2) 100%)",
                padding: "1.6rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f8fafc",
                fontSize: "1.2rem",
                fontWeight: "600",
                cursor: "not-allowed",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={bathroomImage}
                alt="Bathroom"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: 0.5,
                  zIndex: 0,
                }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>화장실</span>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)",
                padding: "1.6rem",
                border: "2px solid rgba(212,175,55,0.2)",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "6.4px",
                overflow: "hidden",
                minHeight: "360px",
              }}
            >
              <h4
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  marginBottom: "0.8rem",
                  color: "#d4af37",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                B 섹션
              </h4>
              {rooms
                .filter((room) => room.SECTION === "B")
                .sort((a, b) => a.y - b.y || a.x - b.x)
                .map((room) => (
                  <div
                    key={room.id}
                    style={{
                      gridColumnStart: Math.floor(room.x / 8) + 1,
                      gridColumnEnd: `span ${Math.floor(room.width / 8)}`,
                      gridRowStart: Math.floor(room.y / 2.4) + 1,
                      gridRowEnd: `span ${Math.floor(room.height / 2.4)}`,
                      padding: "6.4px",
                      textAlign: "center",
                      borderRadius: "6.4px",
                      color: "#f8fafc",
                      cursor:
                        room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가" ? "not-allowed" : "pointer",
                      pointerEvents: room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가" ? "none" : "auto",
                      background:
                        room.status === "사용중" || room.status === "예약불가"
                          ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
                          : room.status === "사용불가"
                          ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                          : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                      position: "relative",
                    }}
                    onClick={() => handleRoomClick(room)}
                    onMouseEnter={(e) => {
                      if (room.status === "예약가능" && room.type !== "empty") {
                        e.target.style.transform = "translateY(-6.4px) scale(1.02)";
                        e.target.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)";
                      }
                      if (
                        (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                        reservationDetails[room.id]
                      ) {
                        e.target.querySelector(".tooltip").style.display = "block";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (room.status === "예약가능" && room.type !== "empty") {
                        e.target.style.transform = "translateY(0) scale(1)";
                        e.target.style.boxShadow = "0 6.4px 20px rgba(0,0,0,0.15)";
                      }
                      if (
                        (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                        reservationDetails[room.id]
                      ) {
                        e.target.querySelector(".tooltip").style.display = "none";
                      }
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "6.4px",
                        right: "6.4px",
                        background:
                          room.status === "예약가능"
                            ? "rgba(46, 204, 113, 0.9)"
                            : room.status === "사용불가"
                            ? "rgba(156, 163, 175, 0.9)"
                            : "rgba(107, 114, 128, 0.9)",
                        color: "#f8fafc",
                        padding: "3.2px 6.4px",
                        borderRadius: "9.6px",
                        fontSize: "0.64rem",
                        fontWeight: "600",
                      }}
                    >
                      {room.status === "예약가능"
                        ? "✅ 이용가능"
                        : room.status === "사용중"
                        ? "🔒 사용중"
                        : room.status === "예약불가"
                        ? "🚫 예약불가"
                        : "🛠 사용불가"}
                    </div>
                    <span>{room.label}</span>
                    {(room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                      reservationDetails[room.id] && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(31,41,55,0.95)",
                            color: "#f8fafc",
                            padding: "0.8rem",
                            borderRadius: "6.4px",
                            fontSize: "0.72rem",
                            zIndex: 10,
                            display: "none",
                            whiteSpace: "nowrap",
                            boxShadow: "0 6.4px 20px rgba(0,0,0,0.3)",
                          }}
                          className="tooltip"
                        >
                          {room.status === "사용불가" ? (
                            <>사유: {reservationDetails[room.id].reason}</>
                          ) : (
                            <>
                              예약자: {reservationDetails[room.id].name}
                              <br />
                              기간: {reservationDetails[room.id].startDate} ~ {reservationDetails[room.id].endDate}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                ))}
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(255,215,0,0.2) 100%)",
                padding: "1.6rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f8fafc",
                fontSize: "1.2rem",
                fontWeight: "600",
                cursor: "not-allowed",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={faxPrinterImage}
                alt="Fax/Printer"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: 0.5,
                  zIndex: 0,
                }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>프린터/스캔</span>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)",
                padding: "1.6rem",
                border: "2px solid rgba(212,175,55,0.2)",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "6.4px",
                overflow: "hidden",
                minHeight: "360px",
              }}
            >
              <h4
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  marginBottom: "0.8rem",
                  color: "#d4af37",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                A 섹션
              </h4>
              {rooms
                .filter((room) => room.SECTION === "A")
                .sort((a, b) => a.y - b.y || a.x - b.x)
                .map((room) => (
                  <div
                    key={room.id}
                    style={{
                      gridColumnStart: Math.floor(room.x / 8) + 1,
                      gridColumnEnd: `span ${Math.floor(room.width / 8)}`,
                      gridRowStart: Math.floor(room.y / 2.4) + 1,
                      gridRowEnd: `span ${Math.floor(room.height / 2.4)}`,
                      padding: "6.4px",
                      textAlign: "center",
                      borderRadius: "6.4px",
                      color: "#f8fafc",
                      cursor:
                        room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가" ? "not-allowed" : "pointer",
                      pointerEvents: room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가" ? "none" : "auto",
                      background:
                        room.status === "사용중" || room.status === "예약불가"
                          ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
                          : room.status === "사용불가"
                          ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                          : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                      position: "relative",
                    }}
                    onClick={() => handleRoomClick(room)}
                    onMouseEnter={(e) => {
                      if (room.status === "예약가능" && room.type !== "empty") {
                        e.target.style.transform = "translateY(-6.4px) scale(1.02)";
                        e.target.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)";
                      }
                      if (
                        (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                        reservationDetails[room.id]
                      ) {
                        e.target.querySelector(".tooltip").style.display = "block";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (room.status === "예약가능" && room.type !== "empty") {
                        e.target.style.transform = "translateY(0) scale(1)";
                        e.target.style.boxShadow = "0 6.4px 20px rgba(0,0,0,0.15)";
                      }
                      if (
                        (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                        reservationDetails[room.id]
                      ) {
                        e.target.querySelector(".tooltip").style.display = "none";
                      }
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "6.4px",
                        right: "6.4px",
                        background:
                          room.status === "예약가능"
                            ? "rgba(46, 204, 113, 0.9)"
                            : room.status === "사용불가"
                            ? "rgba(156, 163, 175, 0.9)"
                            : "rgba(107, 114, 128, 0.9)",
                        color: "#f8fafc",
                        padding: "3.2px 6.4px",
                        borderRadius: "9.6px",
                        fontSize: "0.64rem",
                        fontWeight: "600",
                      }}
                    >
                      {room.status === "예약가능"
                        ? "✅ 이용가능"
                        : room.status === "사용중"
                        ? "🔒 사용중"
                        : room.status === "예약불가"
                        ? "🚫 예약불가"
                        : "🛠 사용불가"}
                    </div>
                    <span>{room.label}</span>
                    {(room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                      reservationDetails[room.id] && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(31,41,55,0.95)",
                            color: "#f8fafc",
                            padding: "0.8rem",
                            borderRadius: "6.4px",
                            fontSize: "0.72rem",
                            zIndex: 10,
                            display: "none",
                            whiteSpace: "nowrap",
                            boxShadow: "0 6.4px 20px rgba(0,0,0,0.3)",
                          }}
                          className="tooltip"
                        >
                          {room.status === "사용불가" ? (
                            <>사유: {reservationDetails[room.id].reason}</>
                          ) : (
                            <>
                              예약자: {reservationDetails[room.id].name}
                              <br />
                              기간: {reservationDetails[room.id].startDate} ~ {reservationDetails[room.id].endDate}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                ))}
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                padding: "1.6rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f3e8ff",
                fontSize: "1.2rem",
                fontWeight: "600",
                cursor: "not-allowed",
                position: "relative",
                overflow: "hidden",
                border: "2px solid rgba(168,85,247,0.4)",
                boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
              }}
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <span style={{ fontSize: "1.4rem", marginBottom: "10px" }}>공용 라운지</span>
                <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>북적이는 카페바 분위기</span>
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)",
                padding: "1.6rem",
                border: "2px solid rgba(212,175,55,0.2)",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridTemplateRows: "repeat(4, 1fr)",
                gap: "6.4px",
                overflow: "hidden",
                minHeight: "360px",
              }}
            >
              <h4
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  marginBottom: "0.8rem",
                  color: "#d4af37",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                C 섹션
              </h4>
              {rooms
                .filter((room) => room.SECTION === "C")
                .sort((a, b) => a.y - b.y || a.x - b.x)
                .map((room) => (
                  <div
                    key={room.id}
                    style={{
                      gridColumnStart: Math.floor(room.x / 8) + 1,
                      gridColumnEnd: `span ${Math.floor(room.width / 8)}`,
                      gridRowStart: Math.floor(room.y / 2.4) + 1,
                      gridRowEnd: `span ${Math.floor(room.height / 2.4)}`,
                      padding: "6.4px",
                      textAlign: "center",
                      borderRadius: "6.4px",
                      color: "#f8fafc",
                      cursor:
                        room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가" ? "not-allowed" : "pointer",
                      pointerEvents: room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가" ? "none" : "auto",
                      background:
                        room.status === "사용중" || room.status === "예약불가"
                          ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
                          : room.status === "사용불가"
                          ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                          : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 6.4px 20px rgba(0,0,0,0.15)",
                      position: "relative",
                    }}
                    onClick={() => handleRoomClick(room)}
                    onMouseEnter={(e) => {
                      if (room.status === "예약가능" && room.type !== "empty") {
                        e.target.style.transform = "translateY(-6.4px) scale(1.02)";
                        e.target.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)";
                      }
                      if (
                        (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                        reservationDetails[room.id]
                      ) {
                        e.target.querySelector(".tooltip").style.display = "block";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (room.status === "예약가능" && room.type !== "empty") {
                        e.target.style.transform = "translateY(0) scale(1)";
                        e.target.style.boxShadow = "0 6.4px 20px rgba(0,0,0,0.15)";
                      }
                      if (
                        (room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                        reservationDetails[room.id]
                      ) {
                        e.target.querySelector(".tooltip").style.display = "none";
                      }
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "6.4px",
                        right: "6.4px",
                        background:
                          room.status === "예약가능"
                            ? "rgba(46, 204, 113, 0.9)"
                            : room.status === "사용불가"
                            ? "rgba(156, 163, 175, 0.9)"
                            : "rgba(107, 114, 128, 0.9)",
                        color: "#f8fafc",
                        padding: "3.2px 6.4px",
                        borderRadius: "9.6px",
                        fontSize: "0.64rem",
                        fontWeight: "600",
                      }}
                    >
                      {room.status === "예약가능"
                        ? "✅ 이용가능"
                        : room.status === "사용중"
                        ? "🔒 사용중"
                        : room.status === "예약불가"
                        ? "🚫 예약불가"
                        : "🛠 사용불가"}
                    </div>
                    <span>{room.label}</span>
                    {(room.status === "사용중" || room.status === "예약불가" || room.status === "사용불가") &&
                      reservationDetails[room.id] && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(31,41,55,0.95)",
                            color: "#f8fafc",
                            padding: "0.8rem",
                            borderRadius: "6.4px",
                            fontSize: "0.72rem",
                            zIndex: 10,
                            display: "none",
                            whiteSpace: "nowrap",
                            boxShadow: "0 6.4px 20px rgba(0,0,0,0.3)",
                          }}
                          className="tooltip"
                        >
                          {room.status === "사용불가" ? (
                            <>사유: {reservationDetails[room.id].reason}</>
                          ) : (
                            <>
                              예약자: {reservationDetails[room.id].name}
                              <br />
                              기간: {reservationDetails[room.id].startDate} ~ {reservationDetails[room.id].endDate}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </div>
          <div
            style={{
              position: "relative",
              bottom: "0",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: "pulse 2s infinite",
              paddingBottom: "8px",
            }}
          >
            <div style={{ fontSize: "0.96rem", color: "#d4af37" }}>🔽</div>
            <span style={{ color: "#d4af37", fontWeight: "700", fontSize: "0.56rem" }}>입구</span>
          </div>
        </div>
      </main>

      <CommonPopup show={showPopup} onHide={handleCancel} onConfirm={handleConfirm} title="🏢 예약 확인">
        {selectedRoom && (
          <div style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
            <div
              style={{
                textAlign: "center",
                marginBottom: "1.2rem",
                padding: "0.8rem",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: "9.6px",
                color: "#d4af37",
                border: "2px solid #d4af37",
              }}
            >
              <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1.04rem", fontWeight: "600", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
                {selectedRoom.label}
              </h4>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "1.2rem",
                borderRadius: "8px",
                marginBottom: "1.2rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <h5
                style={{
                  margin: "0 0 0.8rem 0",
                  color: "#d4af37",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                📋 예약 정보 입력
              </h5>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "500", color: "#d4af37" }}>👤 이름</label>
                <input
                  type="text"
                  name="name"
                  value={userInfo.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력하세요 (예: 홍길동)"
                  style={{
                    width: "100%",
                    padding: "0.4rem",
                    borderRadius: "6.4px",
                    border: "1.6px solid #10b981",
                    fontSize: "0.8rem",
                    background: "rgba(16,185,129,0.1)",
                    color: "#f8fafc",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                />
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "500", color: "#d4af37" }}>🚻 성별</label>
                <select
                  name="gender"
                  value={userInfo.gender}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.4rem",
                    borderRadius: "6.4px",
                    border: "1.6px solid #10b981",
                    fontSize: "0.8rem",
                    background: "rgba(16,185,129,0.1)",
                    color: "#f8fafc",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                >
                  <option value="">선택하세요</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "500", color: "#d4af37" }}>📞 전화번호</label>
                <input
                  type="text"
                  name="phone"
                  value={userInfo.phone}
                  onChange={handleInputChange}
                  placeholder="010-1234-5678"
                  style={{
                    width: "100%",
                    padding: "0.4rem",
                    borderRadius: "6.4px",
                    border: "1.6px solid #10b981",
                    fontSize: "0.8rem",
                    background: "rgba(16,185,129,0.1)",
                    color: "#f8fafc",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                />
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "500", color: "#d4af37" }}>📅 시작 날짜</label>
                <DatePickerCommon
                  id="startDate"
                  type="startday"
                  value={userInfo.startDate}
                  onChange={handleDateChange}
                  placeholder="예약 날짜를 선택하세요 (예: 2025-07-16)"
                  minDate={new Date()}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.8rem", fontWeight: "500", color: "#d4af37" }}>⏰ 기간 (개월)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                  {["1", "6", "12"].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => handleDurationClick(duration)}
                      style={{
                        padding: "0.6rem",
                        background:
                          userInfo.duration === duration ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" : "rgba(16,185,129,0.2)",
                        color: userInfo.duration === duration ? "#d4af37" : "#f8fafc",
                        border: "1.6px solid #10b981",
                        borderRadius: "6.4px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: "500",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (userInfo.duration !== duration) {
                          e.target.style.background = "rgba(212,175,55,0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (userInfo.duration !== duration) {
                          e.target.style.background = "rgba(16,185,129,0.2)";
                        }
                      }}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "500", color: "#d4af37" }}>📝 비고</label>
                <textarea
                  name="note"
                  value={userInfo.note}
                  onChange={handleInputChange}
                  placeholder="추가 요청사항을 입력하세요"
                  style={{
                    width: "100%",
                    padding: "0.4rem",
                    borderRadius: "6.4px",
                    border: "1.6px solid #10b981",
                    fontSize: "0.8rem",
                    background: "rgba(16,185,129,0.1)",
                    color: "#f8fafc",
                    transition: "border-color 0.3s ease",
                    minHeight: "80px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                />
              </div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(255,215,0,0.2) 100%)",
                padding: "1.2rem",
                borderRadius: "8px",
                marginBottom: "0.8rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <h5
                style={{
                  margin: "0 0 0.8rem 0",
                  color: "#d4af37",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                ✨ 포함 시설 & 혜택
              </h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                {selectedRoom.amenities.map((amenity, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "#10b981", fontSize: "0.8rem" }}>✓</span>
                    <span style={{ fontSize: "0.72rem", color: "#f8fafc" }}>{amenity}</span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ color: "#10b981", fontSize: "0.8rem" }}>✓</span>
                  <span style={{ fontSize: "0.72rem", color: "#f8fafc" }}>무료 WiFi</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ color: "#10b981", fontSize: "0.8rem" }}>✓</span>
                  <span style={{ fontSize: "0.72rem", color: "#f8fafc" }}>카페 라운지 이용</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CommonPopup>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default ReservationMain;
