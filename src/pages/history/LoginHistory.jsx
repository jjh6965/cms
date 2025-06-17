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

// ... (기존 코드 생략)

const LoginHistory = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [tableFilters, setTableFilters] = useState({}); // 기존 필터 상태 유지
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [tableStatus, setTableStatus] = useState("initializing");
  const [error, setError] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const tableRef = useRef(null);
  const tableInstance = useRef(null);
  const isInitialRender = useRef(true);
  const latestFiltersRef = useRef(filters);

  const today = new Date("2025-06-11T13:36:00"); // 현재 시간 반영 (KST)
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

  // 기존 필터 설정 유지
  const filterTableFields = [
    {
      id: "filterSelect",
      type: "select",
      label: "",
      options: [
        { value: "", label: "선택" },
        { value: "EMPLOYEE_NO", label: "사원번호" },
        { value: "EMPLOYEE_NAME", label: "이름" },
        { value: "LOGIN_DATE", label: "로그인 날짜" },
        { value: "ACCESS_TYPE", label: "구분(Web/Mobile)" },
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

  useEffect(() => {
    setFilters(initialFilters(searchConfig.areas.find((area) => area.type === "search").fields));
    setTableFilters(initialFilters(filterTableFields));
  }, []);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!user || !hasPermission(user.auth, "loginHistory")) navigate("/");
  }, [user, navigate]);

  // 중앙 정렬 수정 유지
  const columns = [
    { title: "월", field: "MONTH", width: 100, headerHozAlign: "center", hozAlign: "center" },
    { title: "일자", field: "LOGIN_DATE", width: 150, headerHozAlign: "center", hozAlign: "center" }, // 수정: hozAlign을 "center"로 변경
    { title: "사원번호", field: "EMPLOYEE_NO", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "이름", field: "EMPLOYEE_NAME", width: 120, headerHozAlign: "center", hozAlign: "center" }, // 수정: hozAlign을 "center"로 변경
    { title: "사용자IP", field: "USER_IP", width: 150, headerHozAlign: "center", hozAlign: "center" }, // 수정: hozAlign을 "center"로 변경
    { title: "구분(Web/Mobile)", field: "ACCESS_TYPE", width: 150, headerHozAlign: "center", hozAlign: "center" }, // 수정: hozAlign을 "center"로 변경
  ];

  // 수정: columns 기반 동적 필터 필드 생성
  const dynamicFilterFields = columns.map((col) => ({
    id: col.field,
    label: col.title,
    type: "text",
    width: col.width,
    enabled: true,
  }));

  const loadData = async () => {
    setLoading(true);
    setIsSearched(true);
    setError(null);

    const currentFilters = latestFiltersRef.current;

    const params = {
      pMDATE: currentFilters.month || todayMonth.replace("-", ""), // YYYYMM 형식
      pDEBUG: "F",
    };
    console.log("Fetching data with params:", params);
    console.log("Full API URL:", `${common.getServerUrl("history/login/list")}`);

    try {
      const response = await fetchData(api, `${common.getServerUrl("history/login/list")}`, params, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      console.log("Raw API Response:", response);
      if (!response.success) {
        errorMsgPopup(response.message || "로그인 이력 데이터를 가져오는 중 오류가 발생했습니다.");
        setData([]);
        return;
      }
      if (response.errMsg !== "") {
        errorMsgPopup(`서버 오류: ${response.errMsg}`);
        setData([]);
        return;
      }
      const responseData = response.data || [];
      if (!Array.isArray(responseData)) {
        console.error("응답 데이터가 배열이 아님:", responseData);
        setData([]);
        return;
      }
      const mappedData = responseData.map((item) => {
        if (item.vQuery) {
          console.warn("Received vQuery instead of data:", item.vQuery);
          return {};
        }
        // 날짜 수정: login_date를 명확히 "YYYY-MM-DD" 형식으로 변환
        const loginDate = item.login_date ? new Date(item.login_date).toISOString().split("T")[0] : "";
        return {
          MONTH: item.login_date ? item.login_date.substring(0, 7).replace("-", "") : "",
          LOGIN_DATE: loginDate, // 수정: "YYYY-MM-DD" 형식 보장
          EMPLOYEE_NO: item.EMPNO || "",
          EMPLOYEE_NAME: item.username || "",
          USER_IP: item.USER_IP || "",
          ACCESS_TYPE: item.login_status || "",
        };
      });
      setData(mappedData);
      console.log("Mapped data:", mappedData);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      const errorMessage = err.response?.data?.message || "로그인 이력 데이터를 가져오는 중 오류가 발생했습니다.";
      errorMsgPopup(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터 수정: handleDynamicEvent 함수 추가
  const handleDynamicEvent = (eventType) => {
    if (eventType === "search") {
      loadData();
    } else if (eventType === "reset") {
      setFilters(initialFilters(searchConfig.areas.find((area) => area.type === "search").fields));
      setTableFilters(initialFilters(filterTableFields));
      setData([]);
      setIsSearched(false);
    }
  }; //필터 수정: 검색 및 초기화 로직 처리

  useEffect(() => {
    const initializeTable = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!tableRef.current) {
        console.warn("테이블 컨테이너가 준비되지 않았습니다.");
        return;
      }
      try {
        tableInstance.current = createTable(tableRef.current, columns, [], {});
        if (!tableInstance.current) throw new Error("createTable returned undefined or null");
        setTableStatus("ready");
      } catch (err) {
        setTableStatus("error");
        console.error("테이블 초기화 실패: ", err.message);
        setError("테이블 초기화 중 오류 발생: " + err.message);
      }
    };

    initializeTable();

    return () => {
      if (tableInstance.current) {
        tableInstance.current.destroy();
        tableInstance.current = null;
        setTableStatus("initializing");
      }
    };
  }, []);

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

  useEffect(() => {
    if (isInitialRender.current || !tableInstance.current || tableStatus !== "ready" || loading) return;
    const { filterSelect, filterText } = tableFilters;
    if (filterText && filterSelect) {
      tableInstance.current.setFilter(filterSelect, "like", filterText);
    } else if (filterText) {
      tableInstance.current.setFilter(
        [
          { field: "EMPLOYEE_NO", type: "like", value: filterText },
          { field: "EMPLOYEE_NAME", type: "like", value: filterText },
          { field: "LOGIN_DATE", type: "like", value: filterText },
          { field: "ACCESS_TYPE", type: "like", value: filterText },
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
          filterFields={filterTableFields} // 기존 필터 필드 유지
          filters={tableFilters} // 기존 필터 상태 사용
          setFilters={setTableFilters} // 기존 필터 상태 업데이트 함수 사용
          onDownloadExcel={() => handleDownloadExcel(tableInstance.current, tableStatus, "로그인_이력.xlsx")}
          rowCount={rowCount}
          onEvent={handleDynamicEvent} // 수정: handleDynamicEvent 전달
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

export default LoginHistory;
