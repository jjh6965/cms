import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import CommonPopup from "../../components/popup/CommonPopup";
import DatePickerCommon from "../../components/common/DatePickerCommon";
import api from "../../utils/api";
import common from "../../utils/common";
import bathroomImage from "../../assets/images/bathroom.jpg";
import faxPrinterImage from "../../assets/images/fax_printer.jpg";

// 공통 함수 정의 (중복 제거)
const mapRoomTypeToServer = (roomType) => {
  const map = { "1인실": "1인실", "2인실": "2인실", "4인실": "4인실", "8인실": "8인실", 프리미엄: "PREMIUM" };
  return map[roomType] || "1인실";
};

// 공통 함수 정의 (중복 제거) 아래에 추가
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
};

// 한글 주석: 전화번호에서 하이픈을 제거하여 서버 형식으로 변환하는 함수
const formatPhoneForServer = (phone) => {
  return phone.replace(/-/g, ""); // 하이픈 제거
};

// 한글 주석: 날짜에 개월 수를 더해 종료 날짜를 계산하는 함수
const calculateEndDate = (startDate, duration) => {
  if (!startDate || !duration) return "";
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + parseInt(duration));
  return date.toISOString().split("T")[0]; // YYYY-MM-DD 형식
};

// 한글 주석: 선택된 층에 따라 레이아웃 데이터를 조회하고 방 목록을 동적으로 생성하며 모든 섹션 슬롯을 채우는 함수
const fetchLayoutData = async (selectedFloor) => {
  try {
    const response = await api.post(common.getServerUrl("reservation/layout/list"), {
      FLOOR_ID: selectedFloor,
      SECTION: "",
      DEBUG: "F",
    });
    if (response.data.success && Array.isArray(response.data.data)) {
      const roomSizeMap = { "1인실": 1, "2인실": 2, "4인실": 4, "8인실": 8, PREMIUM: 1 };
      const generatedRooms = [];

      const defaultConfig = { slotsPerSection: 8, layoutAdjustment: 1.0 };
      const config = defaultConfig;

      const layoutsBySection = response.data.data.reduce(
        (acc, layout) => {
          const section = layout.SECTION || "A";
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

        // 섹션 내에서 ROOM_INDEX를 기준으로 정렬, 없으면 기본 인덱스 사용
        layouts.sort((a, b) => parseInt(a.ROOM_INDEX || 1) - parseInt(b.ROOM_INDEX || 1));

        layouts.forEach((layout, index) => {
          const size = roomSizeMap[layout.ROOM_TYPE || "1인실"] || 1;
          const roomIndex = parseInt(layout.ROOM_INDEX || index + 1) - 1; // ROOM_INDEX 우선, 없으면 index 기반
          let startIndex = -1;

          const baseWidth = 8 * config.layoutAdjustment;
          const baseHeight = 2.4 * config.layoutAdjustment;
          let width, height;

          const basePrices = {
            "1인실": { 1: 300000, 6: 1710000, 12: 3240000 },
            "2인실": { 1: 550000, 6: 3135000, 12: 5940000 },
            "4인실": { 1: 900000, 6: 5130000, 12: 9720000 },
            "8인실": { 1: 1600000, 6: 9120000, 12: 17280000 },
          };
          const roomType = layout.ROOM_TYPE || "1인실";
          const price = basePrices[roomType][1] || 300000;

          // 섹션 내에서 고유한 호실 번호 생성 (index + 1)
          const roomNumber = index + 1; // 섹션 내 순차적 번호

          if (size === 8) {
            width = 16 * config.layoutAdjustment;
            height = 4 * baseHeight;
            startIndex = 0;
            if (roomPositions.every((pos) => pos === null)) {
              const room = {
                id: layout.ROOM_ID || `room-${section}-${roomNumber}`,
                label: `${selectedFloor} ${section} ${roomType} ${roomNumber}호`,
                type: roomType,
                capacity: size,
                price: price,
                amenities: ["8K 모니터", "화상회의 시설", "프리미엄 의자", "화이트보드", "프로젝터"],
                x: 0,
                y: 0,
                width,
                height,
                color: "#FF6B35",
                status: "예약가능",
                floor: layout.FLOOR_ID || selectedFloor,
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
              roomPositions.slice(roomIndex, roomIndex + 4).every((pos) => pos === null)
            ) {
              startIndex = roomIndex;
            } else {
              for (let i = 0; i <= Math.floor(config.slotsPerSection / 2); i++) {
                if (roomPositions.slice(i, i + 4).every((pos) => pos === null)) {
                  startIndex = i;
                  break;
                }
              }
            }
            if (startIndex !== -1) {
              const room = {
                id: layout.ROOM_ID || `room-${section}-${roomNumber}`,
                label: `${selectedFloor} ${section} ${roomType} ${roomNumber}호`,
                type: roomType,
                capacity: size,
                price: price,
                amenities: ["4K 모니터", "화상회의 시설", "프리미엄 의자"],
                x: (startIndex % 2) * baseWidth,
                y: Math.floor(startIndex / 2) * baseHeight,
                width,
                height,
                color: "#2ecc71",
                status: "예약가능",
                floor: layout.FLOOR_ID || selectedFloor,
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
              roomPositions.slice(roomIndex, roomIndex + 2).every((pos) => pos === null)
            ) {
              startIndex = roomIndex;
            } else {
              for (let i = 0; i < config.slotsPerSection - 1; i += 2) {
                if (roomPositions.slice(i, i + 2).every((pos) => pos === null)) {
                  startIndex = i;
                  break;
                }
              }
            }
            if (startIndex !== -1) {
              const room = {
                id: layout.ROOM_ID || `room-${section}-${roomNumber}`,
                label: `${selectedFloor} ${section} ${roomType} ${roomNumber}호`,
                type: roomType,
                capacity: size,
                price: price,
                amenities: ["4K 모니터", "프리미엄 의자"],
                x: (startIndex % 2) * baseWidth,
                y: Math.floor(startIndex / 2) * baseHeight,
                width,
                height,
                color: "#e74c3c",
                status: "예약가능",
                floor: layout.FLOOR_ID || selectedFloor,
                SECTION: section,
                size: size,
              };
              sectionRooms.push(room);
              for (let i = startIndex; i < startIndex + 2; i++) roomPositions[i] = room;
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
                id: layout.ROOM_ID || `room-${section}-${roomNumber}`,
                label: `${selectedFloor} ${section} ${roomType} ${roomNumber}호`,
                type: roomType,
                capacity: size,
                price: price,
                amenities: ["모니터", "기본 의자"],
                x: (startIndex % 2) * baseWidth,
                y: Math.floor(startIndex / 2) * baseHeight,
                width,
                height,
                color: "#3498db",
                status: "예약가능",
                floor: layout.FLOOR_ID || selectedFloor,
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
              id: `empty-${section}-${i + 1}`,
              label: `${selectedFloor} ${section} 빈 공간`,
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
            roomPositions[i] = { id: `empty-${section}-${i + 1}` };
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

  const fetchReservations = async (generatedRooms) => {
    try {
      const floorId = selectedFloor || "1F";
      const section = selectedRoom ? selectedRoom.SECTION : "";

      const requestData = {
        p_NAME: "",
        p_STATUS: "",
        p_FLOOR_ID: floorId,
        p_SECTION: section,
        p_DEBUG: "F",
      };

      const response = await api.post(common.getServerUrl("reservation/reservation/list"), requestData);

      if (response.data.success && Array.isArray(response.data.data)) {
        const reservedRoomData = response.data.data.reduce((acc, reservation) => {
          let status;
          if (reservation.APPROVAL_STATUS === "승인완료") {
            status = "사용중";
          } else if (reservation.APPROVAL_STATUS === "승인대기" || reservation.STATUS === "예약불가" || reservation.STATUS === "사용 중") {
            status = "예약불가"; // 승인대기, 예약불가, 사용 중 모두 예약불가로 설정
          } else if (reservation.STATUS === "사용불가") {
            status = "사용불가";
          } else {
            status = "예약가능";
          }
          acc[reservation.ROOM_ID] = {
            status,
            name: reservation.NAME,
            startDate: reservation.RESERVATION_DATE,
            endDate: reservation.END_DATE || calculateEndDate(reservation.RESERVATION_DATE, reservation.DURATION),
            reason: reservation.REASON || "유지보수 중",
            price: parseInt(reservation.PRICE) || null,
          };
          return acc;
        }, {});
        const reservedRoomIds = Object.keys(reservedRoomData);
        setReservedRooms(reservedRoomIds);
        setReservationDetails(reservedRoomData);
        const updatedRooms = generatedRooms.map((room) => ({
          ...room,
          status: reservedRoomIds.includes(room.id) ? reservedRoomData[room.id].status : room.type === "empty" ? "empty" : "예약가능",
          color: reservedRoomIds.includes(room.id) && reservedRoomData[room.id].status === "예약불가" ? "#6b7280" : room.color,
          price: reservedRoomIds.includes(room.id) && reservedRoomData[room.id].price ? reservedRoomData[room.id].price : room.price,
        }));
        setRooms(updatedRooms);
      } else if (response.data.errCd === "01" && response.data.errMsg === "조회된 예약 정보가 없습니다.") {
        console.log("예약 데이터가 없습니다. 모든 방을 '예약가능'으로 설정합니다.");
        const updatedRooms = generatedRooms.map((room) => ({
          ...room,
          status: room.type === "empty" ? "empty" : "예약가능",
          price: room.price,
        }));
        setRooms(updatedRooms);
        setReservedRooms([]);
        setReservationDetails({});
      } else {
        console.warn("예상치 못한 응답:", response.data.errMsg || "데이터 없음");
        const updatedRooms = generatedRooms.map((room) => ({
          ...room,
          status: room.type === "empty" ? "empty" : "예약가능",
          price: room.price,
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
        price: room.price,
      }));
      setRooms(updatedRooms);
      setReservedRooms([]);
      setReservationDetails({});
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.post(common.getServerUrl("reservation/layout/list"), {
          FLOOR_ID: "",
          SECTION: "",
          DEBUG: "F",
        });
        if (response.data.success && Array.isArray(response.data.data)) {
          const floorList = [...new Set(response.data.data.map((item) => item.FLOOR_ID))].sort((a, b) => {
            const numA = parseInt(a.replace("F", ""));
            const numB = parseInt(b.replace("F", ""));
            return numA - numB;
          });
          setFloors(floorList);

          // sessionStorage에서 selectedFloorId 가져오기
          const storedFloorId = sessionStorage.getItem("selectedFloorId");
          if (storedFloorId && floorList.includes(storedFloorId)) {
            setSelectedFloor(storedFloorId); // 저장된 층으로 설정
            sessionStorage.removeItem("selectedFloorId"); // 선택 후 정리 (선택적)
          } else if (floorList.length > 0) {
            setSelectedFloor(floorList[0]); // 기본값으로 첫 번째 층
          }
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
        startDate: new Date().toISOString().split("T")[0],
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
  // 날짜 선택 로직
  const handleDateChange = (e) => {
    const { value } = e.target;
    console.log("Received value:", value); // 디버깅용 로그

    // 유효성 검사: value가 존재하고 유효한 날짜인지 확인
    if (!value || value.trim() === "") {
      console.warn("No date value provided, skipping update.");
      // 초기값이 없으면 현재 날짜로 기본 설정 (임시 대응)
      const defaultDate = new Date().toISOString().split("T")[0];
      setUserInfo((prev) => ({
        ...prev,
        startDate: defaultDate,
      }));
      return;
    }

    const selectedDate = new Date(value);
    if (isNaN(selectedDate.getTime())) {
      console.error("Invalid date value received:", value);
      return;
    }

    // 날짜를 그대로 사용 (보정 제거)
    const formattedDate = value; // YYYY-MM-DD 형식 유지
    setUserInfo((prev) => ({
      ...prev,
      startDate: formattedDate,
    }));
  };

  const handleDurationClick = (duration) => {
    if (!["1", "6", "12"].includes(duration)) {
      alert("예약 기간은 1, 6, 12개월 중 하나여야 합니다.");
      return;
    }
    const basePrices = {
      "1인실": { 1: 300000, 6: 1710000, 12: 3240000 },
      "2인실": { 1: 550000, 6: 3135000, 12: 5940000 },
      "4인실": { 1: 900000, 6: 5130000, 12: 9720000 },
      "8인실": { 1: 1600000, 6: 9120000, 12: 17280000 },
    };
    const roomType = selectedRoom ? selectedRoom.type : "1인실";
    const newPrice = basePrices[roomType][parseInt(duration)] || 300000;
    setUserInfo((prev) => ({
      ...prev,
      duration,
      price: newPrice,
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

    // 성별 매핑 함수
    const mapGenderToServer = (gender) => {
      const genderMap = {
        남성: "Male",
        여성: "Female",
      };
      return genderMap[gender] || "Male"; // 기본값으로 'Male' 설정
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

    // 예약 ID 생성
    const generateReservationId = () => {
      return `IMSI_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
    };

    // 예약 요청 데이터 준비 (p_PRICE 제거, 11개 파라미터로 조정)
    const requestData = {
      p_GUBUN: "I", // 등록 작업
      p_RESERVATION_ID: generateReservationId(),
      p_ROOM_ID: selectedRoom.id,
      p_ROOM_TYPE: mapRoomTypeToServer(userInfo.roomType || selectedRoom.type),
      p_NAME: userInfo.name,
      p_GENDER: mapGenderToServer(userInfo.gender),
      p_PHONE: formatPhoneForServer(userInfo.phone),
      p_RESERVATION_DATE: userInfo.startDate,
      p_DURATION: parseInt(userInfo.duration),
      p_EMP_NO: userInfo.empId || "EMP001",
      p_DEBUG: "F",
    };

    try {
      const response = await api.post(common.getServerUrl("reservation/reservation/save"), requestData);
      if (response.data.success && (!response.data.errMsg || response.data.errCd === "00")) {
        alert("예약 및 결제가 성공적으로 완료되었습니다!\n예약 취소 시 관리자에게 문의 하세요. (031-256-2662)");
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

        // 예약 성공 후 방 상태 업데이트
        const generatedRooms = await fetchLayoutData(selectedFloor);
        if (generatedRooms && Array.isArray(generatedRooms)) {
          await fetchReservations(generatedRooms); // 최신 예약 상태 반영
          setRooms((prevRooms) =>
            prevRooms.map((room) => (room.id === selectedRoom.id ? { ...room, status: "예약불가", color: "#6b7280" } : room))
          );
        }
        setShowPopup(false);
        setSelectedRoom(null);
      } else {
        alert(`예약 처리 중 오류가 발생했습니다: ${response.data.errMsg || "알 수 없는 오류"}`);
      }
    } catch (error) {
      alert(`예약 요청 중 오류가 발생했습니다: ${error.response?.data?.errMsg || error.message}`);
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
        width: "100vw", // 한글 주석: 전체 뷰포트 너비로 설정
        margin: 0,
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        fontFamily: "'Noto Sans KR', 'Roboto', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden", // 한글 주석: 가로 스크롤 방지
      }}
    >
      <header
        style={{
          background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          padding: "1rem 0", // 한글 주석: 패딩 축소로 컴팩트하게
          width: "100%",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "100%", // 한글 주석: 최대 너비를 100%로 조정
            margin: "0 auto",
            padding: "0 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate("/reservation/ReservationBuilding")}
            style={{
              padding: "0.4rem 0.8rem",
              background: "linear-gradient(135deg, #d4af37, #ffd700)",
              color: "#1e293b",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            ← 건물 선택으로 돌아가기
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px", // 한글 주석: 아이콘 크기 축소
                height: "32px",
                background: "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
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
                  fontSize: "1.2rem", // 한글 주석: 헤더 폰트 크기 축소
                  fontWeight: "700",
                  margin: 0,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                (주) 시한432 오피스
              </h1>
              <p
                style={{
                  color: "#d4af37",
                  fontSize: "0.6rem", // 한글 주석: 부제목 폰트 축소
                  margin: 0,
                  fontWeight: "400",
                }}
              >
                개지리는 N층#오피스
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                color: "#d4af37",
                fontSize: "0.7rem",
                fontWeight: "500",
              }}
            >
              관리자
            </span>
            <div
              style={{
                width: "28px", // 한글 주석: 아바타 크기 축소
                height: "28px",
                background: "linear-gradient(135deg, #d4af37, #ffd700)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f8fafc",
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              정,변
            </div>
          </div>
        </div>
      </header>
      {/* 컨텐트 비율 조정하는곳(중요!) */}
      <main
        style={{
          transform: "scale(0.8)", // 80% 축소
          transformOrigin: "top left", // 축소 기준점
          width: "124%", // 축소하면 width 줄어드니 보정
          display: "flex",
          flexDirection: "row",
          gap: "0.5rem",
          padding: "0.5rem",
        }}
      >
        <div
          style={{
            flex: "0 0 15%",
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
                    <p style={{ fontSize: "0.62rem", margin: 0, opacity: 0.9 }}>유지보수 또는 기타 이유로 사용 불가</p>
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
                        ? "✅ 예약가능"
                        : room.status === "사용중"
                        ? "🔒 사용중"
                        : room.status === "예약불가"
                        ? "🚫 예약불가"
                        : "🛠 사용불가"}
                    </div>
                    <span>{room.label}</span> {/* 2F A 1인실 1호 등으로 표시 */}
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
                        ? "✅ 예약가능"
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
                        ? "✅ 예약가능"
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
          <div
            className="reservation-popup-content"
            style={{
              fontSize: "0.8rem",
              lineHeight: 1.6,
              color: "#1e293b",
              padding: "1rem",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
              zIndex: 1000,
              isolation: "isolate",
            }}
          >
            {/* ✅ 달력 스타일 수정: z-index 최상위로 설정 및 충돌 방지 */}
            <style>
              {`
          .reservation-popup-content .react-datepicker-popper {
            z-index: 2000 !important;
            left: auto;
            right: -10px;
            transform: translateX(0);
          }
          .reservation-popup-content .react-datepicker {
            border: 1px solid #d4af37;
            box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            font-size: 0.8rem;
            background: rgba(255, 255, 255, 0.95);
            position: relative;
            z-index: 2000;
          }
          .reservation-popup-content .react-datepicker__triangle {
            left: auto;
            right: 20px;
            z-index: 2000;
          }
          .reservation-popup-content {
            overflow: visible !important;
          }
        `}
            </style>

            {/* 상단 박스 */}
            <div
              style={{
                textAlign: "center",
                padding: "0.8rem",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: "9.6px",
                color: "#d4af37",
                border: "2px solid #d4af37",
                position: "relative",
                zIndex: 100,
              }}
            >
              <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1.04rem", fontWeight: "600", textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}>
                {selectedRoom.label}
              </h4>
            </div>

            {/* 입력 폼 */}
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "1.2rem",
                backdropFilter: "blur(10px)",
                minHeight: "400px",
                maxWidth: "400px",
                margin: "0 auto",
                position: "relative",
                zIndex: 150,
              }}
            >
              {/* 👤 이름 */}
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
                    color: "#1e293b",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                />
              </div>

              {/* 🚻 성별 */}
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
                    color: "#1e293b",
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

              {/* 📞 전화번호 */}
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
                    color: "#1e293b",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                />
              </div>

              {/* 📅 시작 날짜 */}
              <div className="datepicker-wrapper" style={{ position: "relative", marginBottom: "0.8rem", zIndex: 2000 }}>
                <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "500", color: "#d4af37" }}>📅 시작 날짜</label>
                <DatePickerCommon
                  id="startDate"
                  type="startday"
                  value={userInfo.startDate}
                  onChange={handleDateChange}
                  placeholder="예약 날짜를 선택하세요 (예: 2025-07-16)"
                  minDate={new Date()}
                  style={{ width: "100%" }}
                  popperPlacement="right-start"
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [0, 10],
                      },
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        padding: 10,
                      },
                    },
                    {
                      name: "zIndex",
                      enabled: true,
                      phase: "beforeWrite",
                      fn: ({ state }) => {
                        state.styles.popper.zIndex = 2000;
                      },
                    },
                  ]}
                />
              </div>

              {/* ⏰ 이용 기간 */}
              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ display: "block", marginBottom: "0.8rem", fontWeight: "500", color: "#d4af37" }}>⏰ 이용 기간</label>
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
                        color: userInfo.duration === duration ? "#d4af37" : "#1e293b",
                        border: "1.6px solid #10b981",
                        borderRadius: "6.4px",
                        cursor: "pointer",
                        fontSize: "0.7rem", // 텍스트 크기 조정
                        fontWeight: "500",
                        transition: "all 0.3s ease",
                        whiteSpace: "normal", // 텍스트 줄바꿈 허용
                        textAlign: "center",
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
                      {duration === "1" && "1개월(정상가)"}
                      {duration === "6" && "6개월(5% 할인)"}
                      {duration === "12" && "12개월(8% 할인)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ⏰ 이용 기간 아래 금액 표시 추가 */}
              {userInfo.duration && userInfo.price > 0 && (
                <div style={{ marginBottom: "0.8rem", padding: "0.8rem", background: "rgba(212,175,55,0.1)", borderRadius: "6.4px" }}>
                  <p style={{ color: "#d4af37", fontWeight: "500", margin: 0 }}>총 금액: {formatPrice(userInfo.price)} (이용료 VAT 별도)</p>
                </div>
              )}

              {/* 📝 비고 */}
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
                    color: "#1e293b",
                    transition: "border-color 0.3s ease",
                    minHeight: "100px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d4af37")}
                  onBlur={(e) => (e.target.style.borderColor = "#10b981")}
                />
              </div>
            </div>
          </div>
        )}
      </CommonPopup>

      <style>{`
        @keyframes pulse { 0%, 100% { opaacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

export default ReservationMain;
