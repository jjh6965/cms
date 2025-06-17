import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import MainSearch from "../../components/main/MainSearch";
import TableSearch from "../../components/table/TableSearch";
import { createTable } from "../../utils/tableConfig";
import { initialFilters } from "../../utils/tableEvent";
import { handleDownloadExcel } from "../../utils/tableExcel";
import styles from "../../components/table/TableSearch.module.css";
import { fetchData } from "../../utils/dataUtils";
import api from "../../utils/api";
import common from "../../utils/common";
import { errorMsgPopup } from "../../utils/errorMsgPopup";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <h2>오류가 발생했습니다.</h2>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>다시 시도</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DbFileWorkHistoryNew = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [tableFilters, setTableFilters] = useState({}); // 추가: 필터 상태
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false); // 추가: 검색 여부
  const [tableStatus, setTableStatus] = useState("initializing");
  const [error, setError] = useState(null);
  const [rowCount, setRowCount] = useState(0); // 추가: 행 수
  const tableRef = useRef(null);
  const tableInstance = useRef(null);
  const isInitialRender = useRef(true); // 추가: 초기 렌더링 플래그
  const latestFiltersRef = useRef(filters); // 추가: 최신 필터 참조

  const today = new Date("2025-06-12T11:25:00"); // 수정: 현재 시간 KST로 업데이트
  const todayMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}`;
  const searchConfig = {
    areas: [
      {
        type: "search",
        fields: [
          {
            id: "month",
            type: "select",
            row: 1,
            label: "월 선택",
            labelVisible: true,
            options: Array.from({ length: 12 }, (_, i) => {
              const month = (i + 1).toString().padStart(2, "0");
              return { value: `2025-${month}`, label: `2025-${month}` };
            }),
            width: "200px",
            height: "30px",
            backgroundColor: "#ffffff",
            color: "#000000",
            enabled: true,
            defaultValue: todayMonth,
          },
          {
            id: "searchBtn",
            type: "button",
            row: 1,
            label: "검색",
            eventType: "search",
            width: "80px",
            height: "30px",
            backgroundColor: "#00c4b4",
            color: "#ffffff",
            enabled: true,
            labelVisible: false,
          },
          {
            id: "resetBtn",
            type: "button",
            row: 1,
            label: "초기화",
            eventType: "reset",
            width: "80px",
            height: "30px",
            backgroundColor: "#00c4b4",
            color: "#ffffff",
            enabled: true,
            labelVisible: false,
          },
        ],
      },
    ],
  };

  // 수정: filterTableFields에 work_name 옵션 추가
  const filterTableFields = [
    {
      id: "filterSelect",
      type: "select",
      label: "",
      options: [
        { value: "", label: "선택" },
        { value: "employee_no", label: "사원번호" },
        { value: "employee_name", label: "이름" },
        { value: "login_date", label: "일자" },
        { value: "access_type", label: "구분(Web/Mobile)" },
        { value: "work_name", label: "작업명" }, // 추가: 작업명 필터 옵션
      ],
      width: "default",
      height: "default",
      backgroundColor: "default",
      color: "default",
      enabled: true,
    },
    {
      id: "filterText",
      type: "text",
      label: "",
      placeholder: "찾을 내용을 입력하세요",
      width: "default",
      height: "default",
      backgroundColor: "default",
      color: "default",
      enabled: true,
    },
  ];
  // result DB colum css(정렬 수정)
  const columns = [
    { title: "월", field: "MONTH", width: 100, headerHozAlign: "center", hozAlign: "center" },
    { title: "일자", field: "login_date", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "사원번호", field: "employee_no", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "이름", field: "employee_name", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "사용자IP", field: "user_ip", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "구분(Web/Mobile)", field: "access_type", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "작업명", field: "work_name", width: 150, headerHozAlign: "center", hozAlign: "center" },
  ];

  // 수정: 초기 필터 설정
  useEffect(() => {
    if (!user || !hasPermission(user.auth, ["systemAdmin", "operator"])) navigate("/");
    setFilters(initialFilters(searchConfig.areas[0].fields));
    setTableFilters(initialFilters(filterTableFields)); // 필터 초기화 추가
  }, [user, navigate]);

  // 추가: 최신 필터 참조 업데이트
  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  // 수정: loadData 함수에서 최신 필터 사용
  const loadData = async (month = todayMonth) => {
    setLoading(true);
    setIsSearched(true); // 검색 상태 업데이트
    setError(null);

    const currentFilters = latestFiltersRef.current; // 최신 필터 사용
    const params = { pMDATE: currentFilters.month.replace("-", ""), pDEBUG: "F" };
    console.log("Fetching data with params:", params);

    try {
      const response = await fetchData(api, `${common.getServerUrl("history/dbfilework/list")}`, params, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      console.log("Raw API Response:", response);
      if (!response.success || response.errMsg !== "") {
        errorMsgPopup(response.message || `서버 오류: ${response.errMsg}` || "데이터 로드 실패");
        setData([]);
        return;
      }
      const mappedData = (response.data || []).map((item) => ({
        MONTH: item.MONTH || "",
        login_date: item.login_date ? item.login_date.substring(0, 10) : "",
        employee_no: item.employee_no || "",
        employee_name: item.employee_name || "",
        user_ip: item.user_ip || "",
        access_type: item.access_type || "",
        work_name: item.work_name || "",
      }));
      setData(mappedData);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      errorMsgPopup(err.response?.data?.message || "데이터 로드 실패");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 수정: handleDynamicEvent에 필터 초기화 로직 추가
  const handleDynamicEvent = (eventType) => {
    if (eventType === "search") {
      loadData(filters.month);
    } else if (eventType === "reset") {
      setFilters(initialFilters(searchConfig.areas[0].fields));
      setTableFilters(initialFilters(filterTableFields)); // 필터 초기화 추가
      setData([]);
      setIsSearched(false); // 검색 상태 초기화
    }
  };

  useEffect(() => {
    const initializeTable = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!tableRef.current) return;
      try {
        tableInstance.current = createTable(tableRef.current, columns, [], {});
        setTableStatus("ready");
      } catch (err) {
        setTableStatus("error");
        setError("테이블 초기화 실패: " + err.message);
      }
    };
    initializeTable();
    return () => tableInstance.current?.destroy();
  }, []);

  // 추가: 테이블 데이터 및 검색 결과 처리
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const table = tableInstance.current;
    if (!table || tableStatus !== "ready" || loading) return;
    if (table.rowManager?.renderer) {
      table.setData(data);
      if (isSearched && data.length === 0 && !loading) {
        tableInstance.current.alert("검색 결과 없음", "info");
      } else {
        tableInstance.current.clearAlert();
        setRowCount(table.getDataCount());
      }
    } else {
      console.warn("renderer가 아직 초기화되지 않았습니다.");
    }
  }, [data, loading, tableStatus, isSearched]);

  // 수정: 테이블 필터링 로직에 work_name 필터 추가
  useEffect(() => {
    if (isInitialRender.current || !tableInstance.current || tableStatus !== "ready" || loading) return;
    const { filterSelect, filterText } = tableFilters;
    if (filterText && filterSelect) {
      tableInstance.current.setFilter(filterSelect, "like", filterText);
    } else if (filterText) {
      tableInstance.current.setFilter(
        [
          { field: "employee_no", type: "like", value: filterText },
          { field: "employee_name", type: "like", value: filterText },
          { field: "login_date", type: "like", value: filterText },
          { field: "access_type", type: "like", value: filterText },
          { field: "work_name", type: "like", value: filterText }, // 추가: 작업명 필터링
        ],
        "or"
      );
    } else {
      tableInstance.current.clearFilter();
    }
  }, [tableFilters.filterSelect, tableFilters.filterText, tableStatus, loading]);

  return (
    <ErrorBoundary>
      <div className={styles.container}>
        {error && <div>{error}</div>}
        <MainSearch config={searchConfig} filters={filters} setFilters={setFilters} onEvent={handleDynamicEvent} />
        <TableSearch
          filterFields={filterTableFields} // 수정: 필터 필드 추가
          filters={tableFilters} // 수정: 필터 상태 전달
          setFilters={setTableFilters} // 수정: 필터 상태 업데이트 함수 전달
          onDownloadExcel={() => handleDownloadExcel(tableInstance.current, tableStatus, "월별_DB_작업이력_FILE.xlsx")}
          rowCount={rowCount} // 수정: 행 수 전달
          onEvent={handleDynamicEvent} // 수정: 이벤트 핸들러 전달
        />
        <div className={styles.tableWrapper}>
          {tableStatus === "initializing" && <div>초기화 중...</div>}
          {loading && <div>로딩 중...</div>}
          <div
            ref={tableRef}
            className={styles.tableSection}
            style={{ visibility: loading || tableStatus !== "ready" ? "hidden" : "visible" }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DbFileWorkHistoryNew;
