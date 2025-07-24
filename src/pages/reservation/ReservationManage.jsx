import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import api from "../../utils/api";
import common from "../../utils/common";

// 상태 매핑 상수 정의
const STATUS_MAP = {
  사용중: "IN_USE",
  예약가능: "AVAILABLE",
  취소: "CANCELLED",
};

const APPROVAL_STATUS_MAP = {
  승인대기: "PENDING",
  승인완료: "APPROVED",
  반려: "REJECTED",
};

const EXTENSION_STATUS_MAP = {
  승인대기: "PENDING",
  승인완료: "APPROVED",
  반려: "REJECTED",
  없음: "NONE",
};

const ROOM_TYPE_MAP = {
  "1인실": "SINGLE",
  "2인실": "DOUBLE",
  "4인실": "QUAD",
  "8인실": "OCTAD",
};

// FLOOR_ID 검증 함수 (XF 또는 XXF 형식만 허용, 최대 5자)
const validateFloorId = (floorId) => {
  if (!floorId || floorId === "") return true; // 빈 값 허용
  return /^([1-9]|[1-2][0-9])F$/.test(floorId) && floorId.length <= 5;
};

// ROOM_ID에서 FLOOR_ID 추출 함수
const extractFloorIdFromRoomId = (roomId) => {
  if (!roomId) return "";
  const match = roomId.match(/^(\d+F)/);
  return match ? match[1] : "";
};

const ReservationManage = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState("");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [floors, setFloors] = useState([]);
  const [sections, setSections] = useState(["A", "B", "C"]);
  const [filters, setFilters] = useState({
    floorId: "",
    section: "",
    roomType: "",
    status: "",
    extensionStatus: "",
    approvalStatus: "",
  });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "",
    phone: "",
    reservationDate: "",
    duration: "",
    note: "",
  });
  const [error, setError] = useState(null);

  // 실시간 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 권한 확인
  useEffect(() => {
    if (!user || !hasPermission(user.auth, "reservationManage")) navigate("/");
  }, [user, navigate]);

  // 층 및 섹션 목록 로드
  useEffect(() => {
    const fetchFloorsAndSections = async () => {
      try {
        const response = await api.post(common.getServerUrl("reservation/reservation/list"), {
          P_FLOOR_ID: "",
          P_SECTION: "",
          P_DEBUG: "F",
        });
        if (response.data?.success) {
          const floorList = [
            ...new Set(
              response.data.data.map((item) => {
                const floorId = item.FLOOR_ID || extractFloorIdFromRoomId(item.ROOM_ID || item.p_ROOM_ID);
                if (!validateFloorId(floorId)) {
                  console.warn(`잘못된 FLOOR_ID 형식: ${floorId}. 무시됨.`);
                  return null;
                }
                return floorId;
              })
            ),
          ]
            .filter((floor) => floor)
            .sort((a, b) => parseInt(a.replace("F", "")) - parseInt(b.replace("F", "")));
          setFloors(floorList);
          const dynamicSections = [...new Set(response.data.data.map((item) => item.SECTION))].filter(Boolean).sort();
          const uniqueSections = ["A", "B", "C", ...dynamicSections].filter((item, index, self) => self.indexOf(item) === index);
          setSections(uniqueSections);
        } else {
          throw new Error(response.data?.errMsg || "층/섹션 데이터가 없습니다.");
        }
      } catch (error) {
        console.error("층/섹션 목록 로드 실패:", error);
        setError("층/섹션 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };
    fetchFloorsAndSections();
  }, []);

  // 예약 목록 조회
  // 예약 목록 조회
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let floorId = filters.floorId || "";
      // FLOOR_ID 강제 검증 및 5자 제한
      if (floorId) {
        // 유효성 검사
        if (!validateFloorId(floorId)) {
          console.warn(`유효하지 않은 FLOOR_ID: ${floorId}. 빈 값으로 대체합니다.`);
          floorId = ""; // 유효하지 않으면 빈 문자열로 설정
        } else if (floorId.length > 5) {
          floorId = floorId.slice(0, 5); // 5자 초과 시 잘라냄
          setFilters((prev) => ({ ...prev, floorId }));
          setError("층 ID가 너무 길어 5자리로 조정되었습니다. (예: 1F, 10F)");
        }
      }
      console.log("최종 P_FLOOR_ID 값:", floorId); // 디버깅 로그 추가

      const filterParams = {
        P_NAME: searchName || "",
        P_FLOOR_ID: floorId, // 검증된 값 사용
        P_SECTION: filters.section || "",
        P_ROOM_TYPE: filters.roomType ? ROOM_TYPE_MAP[filters.roomType] : "",
        P_STATUS: filters.status ? STATUS_MAP[filters.status] : "",
        P_EXTENSION_STATUS: filters.extensionStatus ? EXTENSION_STATUS_MAP[filters.extensionStatus] : "",
        P_APPROVAL_STATUS: filters.approvalStatus ? APPROVAL_STATUS_MAP[filters.approvalStatus] : "",
      };
      console.log("API 호출 파라미터:", filterParams);

      const params = {
        pEMPNO: user?.empNo || "ADMIN",
        pIP: "127.0.0.1",
        pRPTCD: "RESERVATIONSELECT",
        pJOBGB: "SELECT",
        pPARAM: JSON.stringify(filterParams),
        pUSERCONGB: "N",
        pUSERAGENT: navigator.userAgent || "Unknown",
      };

      const response = await api.post(common.getServerUrl("reservation/reservation/list"), params);
      console.log("API 응답:", response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const mappedReservations = response.data.data.map((item) => ({
          id: item.RESERVATION_ID || "",
          roomId: item.ROOM_ID || "",
          floorId: item.FLOOR_ID || extractFloorIdFromRoomId(item.ROOM_ID) || "",
          roomType: Object.keys(ROOM_TYPE_MAP).find((key) => ROOM_TYPE_MAP[key] === item.ROOM_TYPE) || item.ROOM_TYPE || "1인실",
          name: item.NAME || "",
          gender: item.GENDER === "M" ? "남성" : item.GENDER === "F" ? "여성" : item.GENDER || "",
          phone: item.PHONE || "",
          reservationDate: item.START_DATE || "",
          expiryDate: item.END_DATE || "",
          amount: item.PRICE || 0,
          status: Object.keys(STATUS_MAP).find((key) => STATUS_MAP[key] === item.STATUS) || item.STATUS || "예약가능",
          extensionStatus:
            Object.keys(EXTENSION_STATUS_MAP).find((key) => EXTENSION_STATUS_MAP[key] === item.EXTENSION_STATUS) ||
            item.EXTENSION_STATUS ||
            "없음",
          approvalStatus:
            Object.keys(APPROVAL_STATUS_MAP).find((key) => APPROVAL_STATUS_MAP[key] === item.APPROVAL_STATUS) ||
            item.APPROVAL_STATUS ||
            "승인대기",
          note: item.NOTE || "",
          section: item.SECTION || "",
          userId: item.USER_ID || "",
          empId: item.EMP_ID || "",
          createdAt: item.CREATED_AT || "",
          updatedAt: item.UPDATED_AT || "",
          extensionRequestDate: item.EXTENSION_REQUEST_DATE || "",
        }));
        setReservations(mappedReservations);
        console.log("매핑된 예약 데이터:", mappedReservations);
      } else {
        setReservations([]);
        setError(response.data?.errMsg || "예약 데이터가 없습니다.");
      }
    } catch (error) {
      console.error("예약 목록 조회 실패:", error, { params });
      setError(
        error.message.includes("Data too long for column 'p_FLOOR_ID'")
          ? "층 ID가 너무 길어 조회에 실패했습니다. 'XF' 또는 'XXF' 형식을 사용하세요."
          : `데이터베이스 오류: ${error.message || "예약 목록을 불러오는데 실패했습니다."}`
      );
    } finally {
      setLoading(false);
    }
  }, [searchName, filters, user]);

  // 필터 변경 및 검색 시 예약 목록 재로드
  useEffect(() => {
    const handler = setTimeout(() => fetchReservations(), 300);
    return () => clearTimeout(handler);
  }, [fetchReservations]);

  // 예약 상태 변경 (승인/반려/연장 처리)
  const updateReservationStatus = async (reservation, newApprovalStatus, newExtensionStatus = null) => {
    setLoading(true);
    try {
      const response = await api.post(common.getServerUrl("reservation/reservation/save"), {
        P_GUBUN: "U",
        P_RESERVATION_ID: reservation.id || "",
        P_ROOM_ID: reservation.roomId || "",
        P_ROOM_TYPE: ROOM_TYPE_MAP[reservation.roomType] || reservation.roomType || "SINGLE",
        P_NAME: reservation.name || "",
        P_GENDER: reservation.gender === "남성" ? "M" : reservation.gender === "여성" ? "F" : reservation.gender || "",
        P_PHONE: reservation.phone.replace(/-/g, "") || "",
        P_START_DATE: reservation.reservationDate || "",
        P_DURATION: reservation.duration || "",
        P_EXTENSION_STATUS: newExtensionStatus || reservation.extensionStatus || "NONE",
        P_APPROVAL_STATUS: newApprovalStatus || reservation.approvalStatus || "",
        P_PRICE: reservation.amount || 0,
        P_EMP_ID: user?.empNo || "ADMIN",
        P_NOTE: newApprovalStatus === "REJECTED" ? "관리자가 반려했습니다." : reservation.note || "",
      });
      if (response.data?.success) {
        alert("처리가 완료되었습니다.");
        fetchReservations();
      } else {
        throw new Error(response.data?.errMsg || "처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("예약 상태 변경 실패:", error);
      setError(error.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 승인 처리
  const handleApprove = (reservation) => {
    if (window.confirm(`${reservation.name}님의 예약을 승인하시겠습니까?`)) {
      updateReservationStatus(reservation, "APPROVED");
    }
  };

  // 반려 처리
  const handleReject = (reservation) => {
    if (window.confirm(`${reservation.name}님의 예약을 반려하시겠습니까?`)) {
      updateReservationStatus(reservation, "REJECTED");
    }
  };

  // 연장 승인 처리
  const handleExtensionApprove = (reservation) => {
    if (window.confirm(`${reservation.name}님의 연장요청을 승인하시겠습니까?`)) {
      updateReservationStatus(reservation, reservation.approvalStatus, "APPROVED");
    }
  };

  // 연장 반려 처리
  const handleExtensionReject = (reservation) => {
    if (window.confirm(`${reservation.name}님의 연장요청을 반려하시겠습니까?`)) {
      updateReservationStatus(reservation, reservation.approvalStatus, "REJECTED");
    }
  };

  // 예약 수정 다이얼로그 열기
  const handleEditClick = (reservation) => {
    setSelectedReservation(reservation);
    setEditForm({
      name: reservation.name || "",
      gender: reservation.gender || "",
      phone: reservation.phone || "",
      reservationDate: reservation.reservationDate || "",
      duration: reservation.duration || "",
      note: reservation.note || "",
    });
    setOpenEditDialog(true);
  };

  // 예약 수정 처리
  const handleEditConfirm = async () => {
    if (!editForm.name || !editForm.gender || !editForm.phone || !editForm.reservationDate || !editForm.duration) {
      alert("모든 필수 정보를 입력해주세요.");
      return;
    }
    if (!editForm.phone.match(/^\d{3}-\d{3,4}-\d{4}$/)) {
      alert("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }
    if (new Date(editForm.reservationDate) < new Date()) {
      alert("유효한 미래 날짜를 선택해주세요.");
      return;
    }
    if (!["1", "6", "12"].includes(editForm.duration.toString())) {
      alert("예약 기간은 1, 6, 12개월 중 하나여야 합니다.");
      return;
    }

    try {
      const response = await api.post(common.getServerUrl("reservation/reservation/save"), {
        P_GUBUN: "U",
        P_RESERVATION_ID: selectedReservation.id || "",
        P_ROOM_ID: selectedReservation.roomId || "",
        P_ROOM_TYPE: ROOM_TYPE_MAP[selectedReservation.roomType] || selectedReservation.roomType || "SINGLE",
        P_NAME: editForm.name || "",
        P_GENDER: editForm.gender === "남성" ? "M" : editForm.gender === "여성" ? "F" : editForm.gender || "",
        P_PHONE: editForm.phone.replace(/-/g, "") || "",
        P_START_DATE: editForm.reservationDate || "",
        P_DURATION: parseInt(editForm.duration) || 1,
        P_NOTE: editForm.note || "",
        P_EMP_ID: user?.empNo || "ADMIN",
      });
      if (response.data?.success) {
        alert("예약이 성공적으로 수정되었습니다.");
        setOpenEditDialog(false);
        fetchReservations();
      } else {
        throw new Error(response.data?.errMsg || "예약 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("예약 수정 실패:", error);
      setError(error.message || "예약 수정 중 오류가 발생했습니다.");
    }
  };

  // 필터 변경 처리
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "floorId" && value && !validateFloorId(value)) {
      alert("층 ID는 'XF' 또는 'XXF' 형식(예: 1F, 10F)여야 합니다.");
      return;
    }
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // 검색 버튼 클릭 처리
  const handleSearch = () => {
    fetchReservations();
  };

  // 엔터키로 검색 처리
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (!price) return "0원";
    return new Intl.NumberFormat("ko-KR").format(Number(price)) + "원";
  };

  // 상태 색상 설정
  const getStatusColor = (approvalStatus, extensionStatus) => {
    if (approvalStatus === "승인대기") return "#FF6B6B";
    if (extensionStatus === "승인대기") return "#2ecc71";
    if (approvalStatus === "승인완료") return "#51CF66";
    if (approvalStatus === "반려") return "#868E96";
    return "#868E96";
  };

  // 상태 텍스트 설정
  const getStatusText = (approvalStatus, extensionStatus) => {
    if (approvalStatus === "승인대기") return "승인대기";
    if (extensionStatus === "승인대기") return "연장대기";
    if (approvalStatus === "승인완료") return "사용중";
    if (approvalStatus === "반려") return "반려됨";
    return "완료";
  };

  // 예약 통계 계산
  const pendingCount = reservations.filter((r) => r.approvalStatus === "승인대기").length;
  const approvedCount = reservations.filter((r) => r.approvalStatus === "승인완료").length;
  const extensionCount = reservations.filter((r) => r.extensionStatus === "승인대기").length;

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
                (주) 시한432 오피스 - 관리
              </h1>
              <p
                style={{
                  color: "#d4af37",
                  fontSize: "0.72rem",
                  margin: 0,
                  fontWeight: "400",
                }}
              >
                예약 관리 시스템
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
          flexDirection: "column",
          gap: "1.2rem",
          width: "100%",
          maxWidth: "2400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            background: "linear-gradient(180deg, #1e293b 0%, #334155 100%)",
            padding: "1.6rem",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(212,175,55,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              name="floorId"
              value={filters.floorId}
              onChange={handleFilterChange}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                width: "120px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
              title="층 ID는 'XF' 또는 'XXF' 형식(예: 1F, 10F)"
            >
              <option value="">층 선택</option>
              {floors.map((floor) => (
                <option key={floor} value={floor} style={{ color: "#1e293b" }}>
                  {floor}
                </option>
              ))}
            </select>
            <select
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                width: "120px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            >
              <option value="">섹션 선택</option>
              {sections.map((section, index) => (
                <option key={`${section}-${index}`} value={section} style={{ color: "#1e293b" }}>
                  {section}
                </option>
              ))}
            </select>
            <select
              name="roomType"
              value={filters.roomType}
              onChange={handleFilterChange}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                width: "120px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            >
              <option value="">호실 유형</option>
              {Object.keys(ROOM_TYPE_MAP).map((type) => (
                <option key={type} value={type} style={{ color: "#1e293b" }}>
                  {type}
                </option>
              ))}
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                width: "120px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            >
              <option value="">예약 상태</option>
              {Object.keys(STATUS_MAP).map((status) => (
                <option key={status} value={status} style={{ color: "#1e293b" }}>
                  {status}
                </option>
              ))}
            </select>
            <select
              name="extensionStatus"
              value={filters.extensionStatus}
              onChange={handleFilterChange}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                width: "120px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            >
              <option value="">연장 상태</option>
              {Object.keys(EXTENSION_STATUS_MAP).map((status) => (
                <option key={status} value={status} style={{ color: "#1e293b" }}>
                  {status}
                </option>
              ))}
            </select>
            <select
              name="approvalStatus"
              value={filters.approvalStatus}
              onChange={handleFilterChange}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                width: "120px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            >
              <option value="">승인 상태</option>
              {Object.keys(APPROVAL_STATUS_MAP).map((status) => (
                <option key={status} value={status} style={{ color: "#1e293b" }}>
                  {status}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="예약자 이름"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                width: "200px",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            />
            <button
              style={{
                padding: "0.6rem 1.2rem",
                background: "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)",
                color: "#f8fafc",
                border: "none",
                borderRadius: "6.4px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "bold",
                transition: "background 0.3s ease",
              }}
              onClick={handleSearch}
              onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #ffd700 0%, #d4af37 100%)")}
              onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)")}
            >
              검색
            </button>
            <button
              style={{
                padding: "0.6rem 1.2rem",
                background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
                color: "#f8fafc",
                border: "none",
                borderRadius: "6.4px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "bold",
                transition: "background 0.3s ease",
              }}
              onClick={fetchReservations}
              onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)")}
              onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)")}
            >
              새로고침
            </button>
          </div>
        </div>

        <div
          style={{
            flex: "0 0 auto",
            background: "linear-gradient(180deg, #1e293b 0%, #334155 100%)",
            padding: "1.6rem",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(212,175,55,0.3)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1.2rem",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(255,215,0,0.2) 100%)",
              padding: "1.6rem",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              border: "0.8px solid rgba(212,175,55,0.3)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#d4af37", fontSize: "0.8rem", margin: 0 }}>승인 대기</p>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "#f8fafc", margin: "0.5rem 0" }}>{pendingCount}</p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
              padding: "1.6rem",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              border: "0.8px solid rgba(46, 204, 113, 0.3)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#2ecc71", fontSize: "0.8rem", margin: 0 }}>사용 중</p>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "#f8fafc", margin: "0.5rem 0" }}>{approvedCount}</p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #4ECDC4 0%, #38D9A9 100%)",
              padding: "1.6rem",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              border: "0.8px solid rgba(78, 205, 196, 0.3)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#4ECDC4", fontSize: "0.8rem", margin: 0 }}>연장 요청</p>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "#f8fafc", margin: "0.5rem 0" }}>{extensionCount}</p>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(255,215,0,0.2) 100%)",
              padding: "1.6rem",
              borderRadius: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              border: "0.8px solid rgba(212,175,55,0.3)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#d4af37", fontSize: "0.8rem", margin: 0 }}>전체 예약</p>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "#f8fafc", margin: "0.5rem 0" }}>{reservations.length}</p>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              fontSize: "16px",
              color: "#f8fafc",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            데이터를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              fontSize: "16px",
              color: "#FF6B6B",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {error}
          </div>
        ) : reservations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              fontSize: "16px",
              color: "#f8fafc",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            예약 정보가 없습니다.
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)",
              borderRadius: "20px",
              overflowX: "auto",
              boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
              border: "2px solid rgba(212,175,55,0.2)",
              backdropFilter: "blur(15px)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                color: "#f8fafc",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
                    borderBottom: "2px solid #d4af37",
                  }}
                >
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>예약 ID</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>호실</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>층</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>방 종류</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>예약자</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>성별</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>전화번호</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>시작일</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>만료일</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>금액</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>상태</th>
                  <th style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation, index) => (
                  <tr
                    key={reservation.id || index}
                    style={{
                      transition: "background 0.3s ease",
                      "&:hover": {
                        background: "rgba(255,255,255,0.1)",
                      },
                    }}
                  >
                    <td style={{ padding: "10px", textAlign: "center" }}>{reservation.id}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{reservation.roomId}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{reservation.floorId}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{reservation.roomType}</td>
                    <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>{reservation.name}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{reservation.gender}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{reservation.phone}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{formatDate(reservation.reservationDate)}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{formatDate(reservation.expiryDate)}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>{formatPrice(reservation.amount)}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "16px",
                          color: "#f8fafc",
                          fontWeight: "bold",
                          fontSize: "12px",
                          textAlign: "center",
                          minWidth: "60px",
                          display: "inline-block",
                          backgroundColor: getStatusColor(reservation.approvalStatus, reservation.extensionStatus),
                        }}
                      >
                        {getStatusText(reservation.approvalStatus, reservation.extensionStatus)}
                      </span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      {reservation.approvalStatus === "승인대기" && (
                        <>
                          <button
                            style={{
                              padding: "6px 12px",
                              margin: "0 4px",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
                              color: "#f8fafc",
                              transition: "background 0.2s",
                            }}
                            onClick={() => handleApprove(reservation)}
                            onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)")}
                            onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)")}
                          >
                            승인
                          </button>
                          <button
                            style={{
                              padding: "6px 12px",
                              margin: "0 4px",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              background: "linear-gradient(135deg, #FF6B6B 0%, #e74c3c 100%)",
                              color: "#f8fafc",
                              transition: "background 0.2s",
                            }}
                            onClick={() => handleReject(reservation)}
                            onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #e74c3c 0%, #FF6B6B 100%)")}
                            onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #FF6B6B 0%, #e74c3c 100%)")}
                          >
                            반려
                          </button>
                        </>
                      )}
                      {reservation.extensionStatus === "승인대기" && (
                        <>
                          <button
                            style={{
                              padding: "6px 12px",
                              margin: "0 4px",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              background: "linear-gradient(135deg, #4ECDC4 0%, #38D9A9 100%)",
                              color: "#f8fafc",
                              transition: "background 0.2s",
                            }}
                            onClick={() => handleExtensionApprove(reservation)}
                            onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #38D9A9 0%, #4ECDC4 100%)")}
                            onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #4ECDC4 0%, #38D9A9 100%)")}
                          >
                            연장승인
                          </button>
                          <button
                            style={{
                              padding: "6px 12px",
                              margin: "0 4px",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              background: "linear-gradient(135deg, #FF6B6B 0%, #e74c3c 100%)",
                              color: "#f8fafc",
                              transition: "background 0.2s",
                            }}
                            onClick={() => handleExtensionReject(reservation)}
                            onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #e74c3c 0%, #FF6B6B 100%)")}
                            onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #FF6B6B 0%, #e74c3c 100%)")}
                          >
                            연장반려
                          </button>
                        </>
                      )}
                      {reservation.approvalStatus === "승인완료" && reservation.extensionStatus === "없음" && (
                        <span style={{ color: "#51CF66", fontWeight: "bold" }}>✅ 사용중</span>
                      )}
                      {reservation.approvalStatus === "반려" && <span style={{ color: "#FF6B6B", fontWeight: "bold" }}>❌ 반려됨</span>}
                      <button
                        style={{
                          padding: "6px 12px",
                          margin: "0 4px",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          background: "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)",
                          color: "#f8fafc",
                          transition: "background 0.2s",
                        }}
                        onClick={() => handleEditClick(reservation)}
                        onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #ffd700 0%, #d4af37 100%)")}
                        onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)")}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {openEditDialog && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            padding: "15px",
            maxWidth: "400px",
            width: "90%",
            zIndex: 1000,
            border: "2px solid #d4af37",
          }}
        >
          <h2 style={{ fontSize: "18px", margin: "0 0 10px", textAlign: "center", color: "#f8fafc" }}>예약 수정</h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "rgba(255,255,255,0.05)",
              padding: "15px",
              borderRadius: "6px",
            }}
          >
            <input
              type="text"
              placeholder="예약자 이름"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              style={{
                padding: "0.4rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            />
            <select
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              style={{
                padding: "0.4rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            >
              <option value="">성별 선택</option>
              <option value="남성" style={{ color: "#1e293b" }}>
                남성
              </option>
              <option value="여성" style={{ color: "#1e293b" }}>
                여성
              </option>
            </select>
            <input
              type="text"
              placeholder="전화번호 (예: 010-1234-5678)"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              style={{
                padding: "0.4rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            />
            <input
              type="date"
              value={editForm.reservationDate}
              onChange={(e) => setEditForm({ ...editForm, reservationDate: e.target.value })}
              style={{
                padding: "0.4rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            />
            <input
              type="number"
              placeholder="예약 기간 (개월)"
              value={editForm.duration}
              onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
              style={{
                padding: "0.4rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            />
            <textarea
              placeholder="특이사항"
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              rows="3"
              style={{
                padding: "0.4rem",
                borderRadius: "6.4px",
                border: "1.6px solid #d4af37",
                fontSize: "0.8rem",
                background: "rgba(15,23,42,0.8)",
                color: "#f8fafc",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
              onBlur={(e) => (e.target.style.borderColor = "#d4af37")}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <button
              style={{
                padding: "0.6rem 1.2rem",
                background: "linear-gradient(135deg, #868E96 0%, #6B7280 100%)",
                color: "#f8fafc",
                border: "none",
                borderRadius: "6.4px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "bold",
                transition: "background 0.3s ease",
              }}
              onClick={() => setOpenEditDialog(false)}
              onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #6B7280 0%, #868E96 100%)")}
              onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #868E96 0%, #6B7280 100%)")}
            >
              취소
            </button>
            <button
              style={{
                padding: "0.6rem 1.2rem",
                background: "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)",
                color: "#f8fafc",
                border: "none",
                borderRadius: "6.4px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: "bold",
                transition: "background 0.3s ease",
              }}
              onClick={handleEditConfirm}
              onMouseEnter={(e) => (e.target.style.background = "linear-gradient(135deg, #ffd700 0%, #d4af37 100%)")}
              onMouseLeave={(e) => (e.target.style.background = "linear-gradient(135deg, #d4af37 0%, #ffd700 100%)")}
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManage;
