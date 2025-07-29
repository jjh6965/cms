import React, { useState, useEffect, useRef } from "react";
import { createTable } from "../../utils/tableConfig"; // Tabulator 테이블 생성 유틸
import { handleDownloadExcel } from "../../utils/tableExcel"; // 엑셀 다운로드 유틸
import CommonPopup from "../../components/popup/CommonPopup"; // 팝업 컴포넌트 (필요시)
import styles from "./MonthlyLoginHistory.module.css"; // 이 컴포넌트 전용 CSS 모듈

const MAX_RESULT_SIZE = 50; // 최대 결과 수

const MonthlyLoginHistory = () => {
  const tableRef = useRef(null); // Tabulator 테이블 컨테이너 ref
  const tableInstance = useRef(null); // Tabulator 인스턴스 ref
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태
  const [rowCount, setRowCount] = useState(0); // 총 행 수
  const [tableStatus, setTableStatus] = useState("initializing"); // 테이블 초기화 상태
  const [displayData, setDisplayData] = useState([]); // 테이블에 표시될 데이터

  // draw.io UI에 맞춰 기간(날짜) 필터 상태 추가
  // 현재 날짜를 기반으로 초기값을 설정 (예: 오늘 날짜와 한 달 전)
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1); // 현재 월에서 1개월 전으로 설정

  // 날짜를 YYYY-MM-DD 형식의 문자열로 변환하는 헬퍼 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(formatDate(oneMonthAgo)); // 한 달 전 날짜로 초기값 설정
  const [endDate, setEndDate] = useState(formatDate(today)); // 오늘 날짜로 초기값 설정

  // isInitialRender 정의 (첫 렌더링 시 특정 로직 제어용)
  const isInitialRender = useRef(true); 

  // Tabulator 테이블 컬럼 정의 (draw.io 및 userLoginHistory.json 데이터 구조 기반)
  const columns = [
    { title: "No.", field: "id", hozAlign: "center", width: 60, formatter: "rownum" }, // "No." 컬럼 (Tabulator 기본 rownum formatter 사용)
    { title: "월", field: "MDATE", hozAlign: "center", headerFilter: true, width: 100 },
    { title: "일자", field: "DDATE", hozAlign: "center", headerFilter: true, width: 120 },
    { title: "사원번호", field: "EMPNO", hozAlign: "center", headerFilter: true, width: 120 },
    { title: "이름", field: "EMPNM", hozAlign: "center", headerFilter: true, width: 120 },
    { title: "사용자IP", field: "USERIP", hozAlign: "center", headerFilter: true, width: 150 },
    { title: "구분(W/M)", field: "USERCONGB", hozAlign: "center", headerFilter: true, width: 100 },
  ];

  // Tabulator 테이블 초기화 (컴포넌트 마운트 시 한 번만 실행)
  useEffect(() => {
    const initializeTable = async () => {
      if (!tableRef.current) {
        console.warn("테이블 컨테이너가 준비되지 않았습니다.");
        return;
      }
      try {
        tableInstance.current = createTable(tableRef.current, [], columns, {
          pagination: "local", // 로컬 페이지네이션 사용
          paginationSize: 10, // 한 페이지에 10개씩 항목 표시
          paginationSizeSelector: [10, 20, 50, 100, true], // 페이지당 항목 수 선택 옵션
          layout: "fitColumns", // 컬럼 너비를 테이블 너비에 맞게 조절
        });
        if (!tableInstance.current) {
            throw new Error("createTable 함수가 유효한 Tabulator 인스턴스를 반환하지 않았습니다.");
        }
        setTableStatus("ready");

        // 테이블 초기화 후, 초기 날짜 필터 값을 사용하여 즉시 데이터 로드
        await executeSearch(); 

      } catch (err) {
        setTableStatus("error");
        console.error("테이블 초기화 실패:", err.message);
        setError("테이블 초기화 중 오류가 발생했습니다.");
      }
    };

    initializeTable();

    // 컴포넌트 언마운트 시 Tabulator 인스턴스 정리 (메모리 누수 방지)
    return () => {
      if (tableInstance.current) {
        tableInstance.current.destroy();
        tableInstance.current = null;
        setTableStatus("initializing");
      }
    };
  }, []); // 의존성 배열이 비어있으므로, 컴포넌트 마운트 시 한 번만 실행

  // displayData(테이블에 표시될 데이터) 상태가 변경될 때 Tabulator 테이블을 업데이트
  useEffect(() => {
    if (!tableInstance.current || tableStatus !== "ready") {
        return; // 테이블 인스턴스가 없거나 준비되지 않았으면 아무것도 하지 않음
    }

    if (loading) {
      // 데이터 로딩 중이면 테이블 데이터 초기화 및 로딩 메시지 표시
      tableInstance.current.clearData();
      setRowCount(0);
      tableInstance.current.alert("데이터 로딩 중...", "loading");
      return;
    }

    if (displayData.length === 0) {
      // 표시할 데이터가 없으면 테이블 초기화 및 메시지 표시
      tableInstance.current.clearData();
      setRowCount(0);
      // 첫 렌더링 시에는 "검색 결과 없음" 메시지를 바로 보여주지 않음 (UX 고려)
      if (!isInitialRender.current) {
        tableInstance.current.alert("검색 결과 없음", "info");
      } else {
        tableInstance.current.clearAlert(); // 초기에는 메시지 없음
      }
    } else {
      // 데이터가 있으면 테이블에 데이터 설정 및 메시지 제거
      tableInstance.current.setData(displayData);
      tableInstance.current.clearAlert();
      setRowCount(displayData.length); // 실제 데이터 수로 총 행 수 업데이트
    }
    isInitialRender.current = false; // 첫 렌더링이 완료되었음을 표시
  }, [displayData, loading, tableStatus]);


  /**
   * 데이터 조회 함수 (draw.io UI의 "조회" 버튼 클릭 시 실행)
   * 선택된 기간에 따라 userLoginHistory.json 데이터를 필터링합니다.
   */
  const executeSearch = async () => {
    if (!tableInstance.current || tableStatus !== "ready") {
      console.warn("테이블 인스턴스 또는 상태가 준비되지 않아 검색을 실행할 수 없습니다.");
      return;
    }

    setLoading(true); // 로딩 상태 시작
    setError(null); // 이전 에러 초기화

    try {

       // userLoginHistory.json에서 전체 로그인 이력 데이터를 가져옴
    // 백엔드 API(/api/oper/loginHistory)로 post 요청을 보내기 위한 fetch 호출 추가
    const response = await fetch("http://localhost:5173/api/oper/loginHistory", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ startDate, endDate }),
});
if (!response.ok) throw new Error("API 요청 실패");
const result = await response.json();
const data = result.data || [];

let filteredResults = [...data]; // 필터링을 위한 복사본

    // 날짜 필터링 로직: startDate ~ endDate (포함)
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 종료일의 마지막 밀리초까지 포함시켜 하루 종일 검색되도록 함

        filteredResults = filteredResults.filter(item => {
        // userLoginHistory.json의 DDATE 필드 (예: "2025-05-15")를 Date 객체로 변환
        const itemDate = new Date(item.DDATE);
        // 항목의 날짜가 시작일과 종료일 범위 내에 있는지 확인
        return itemDate >= start && itemDate <= end;
    });

        // MAX_RESULT_SIZE 제한 적용 (불필요한 대량 데이터 렌더링 방지)
    const limitedResults = filteredResults.slice(0, MAX_RESULT_SIZE);

     setDisplayData(limitedResults); // 필터링된 데이터를 테이블에 표시하도록 상태 업데이트

    } catch (err) {
      console.log("데이터 조회 오류:", err.message);
      setError("데이터를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  
  };

  return (
    <div className={styles.container}>
      {/* draw.io UI의 상단 검색 및 버튼 영역 */}
      <div className={styles.topSearchArea}>
        <div className={styles.dateFilterGroup}>
          <label htmlFor="startDate" className={styles.dateLabel}>기간</label>
          <input
            type="date" // HTML5 날짜 선택기 사용
            id="startDate"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className={styles.dateSeparator}>~</span>
          <input
            type="date" // HTML5 날짜 선택기 사용
            id="endDate"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          type="button" // <--- **이 속성이 중요합니다! 폼 제출 방지.**
          className={styles.searchButton}
          onClick={executeSearch} // 버튼 클릭 시 조회 함수 실행
        >
          조회
        </button>
      </div>

      {/* "Total : N" 및 "엑셀 다운로드" 버튼 영역 (테이블 위에 위치) */}
      <div className={styles.tableToolbar}>
        <span className={styles.totalCount}>Total : {rowCount}</span>
        <button
          className={styles.downloadExcelButton}
          onClick={() => handleDownloadExcel(tableInstance.current, tableStatus, '로그인이력.xlsx')}
        >
          엑셀 다운로드
        </button>
      </div>

      {/* Tabulator 테이블이 렌더링될 실제 영역 */}
      <div className={styles.tableWrapper}>
        {/* 테이블 초기화 또는 에러 메시지 표시 */}
        {tableStatus === "initializing" && <div className={styles.message}>테이블 초기화 중...</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div
          ref={tableRef} // Tabulator가 이 div에 렌더링됩니다.
          className={styles.tableSection}
          // 로딩 중이거나 테이블이 준비되지 않았을 때는 테이블을 숨김
          style={{ visibility: loading || tableStatus !== "ready" ? "hidden" : "visible" }}
        />
      </div>

      {/* CommonPopup 컴포넌트는 필요에 따라 주석 해제하여 사용 */}
      {/* <CommonPopup /> */}
    </div>
  );
};

export default MonthlyLoginHistory;