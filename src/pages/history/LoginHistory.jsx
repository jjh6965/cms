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

  const today = new Date(); // 수정: 고정된 날짜 대신 현재 날짜 사용
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
            options: [
              { value: todayMonth, label: todayMonth }, // 현재 월(2025-06)을 첫 번째로
              ...Array.from({ length: today.getMonth() }, (_, i) => {
                const month = (today.getMonth() - i).toString().padStart(2, "0"); // 역순으로 이전 월
                return { value: `2025-${month}`, label: `2025-${month}` };
              }),
              ...Array.from({ length: 12 - today.getMonth() - 1 }, (_, i) => {
                const month = (today.getMonth() + 1 + i + 1).toString().padStart(2, "0"); // 이후 월
                return { value: `2025-${month}`, label: `2025-${month}` };
              }),
            ].filter(
              (item, index, self) => index === self.findIndex((t) => t.value === item.value) // 중복 제거
            ),
            width: "200px",
            height: "30px",
            backgroundColor: "#ffffff",
            color: "#000000",
            enabled: true,
            defaultValue: todayMonth,
          },
        ],
      },
      // 수정: searchBtn을 buttons 영역으로 이동하여 우측 끝 배치 (UserAuthManage.jsx 참고)
      {
        type: "buttons",
        fields: [
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
          // 초기화 버튼
          // {
          //   id: "resetBtn",
          //   type: "button",
          //   row: 1,
          //   label: "초기화",
          //   eventType: "reset",
          //   width: "80px",
          //   height: "30px",
          //   backgroundColor: "#00c4b4",
          //   color: "#ffffff",
          //   enabled: true,
          //   labelVisible: false,
          // },
        ],
      },
    ],
  };

  // 수정: filterTableFields를 columns에 맞게 조정
  const filterTableFields = [
    {
      id: "filterSelect",
      type: "select",
      label: "",
      options: [
        { value: "", label: "선택" },
        { value: "MONTH", label: "월" },
        { value: "DATE", label: "일자" },
        { value: "EMPNO", label: "사원번호" },
        { value: "EMPNM", label: "이름" },
        { value: "USERIP", label: "사용자IP" },
        { value: "LOGIN_STATUS", label: "구분(Web/Mobile)" },
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

  // columns css 정렬
  const columns = [
    { title: "월", field: "MONTH", width: 100, headerHozAlign: "center", hozAlign: "center" },
    { title: "일자", field: "DATE", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "사원번호", field: "EMPNO", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "이름", field: "EMPNM", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "사용자IP", field: "USERIP", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "구분(Web/Mobile)",field: "LOGIN_STATUS",width: 150, headerHozAlign: "center", hozAlign: "center", 
      formatter: (cell) => {
      // w를 Web, m을 Mobile로 변환
      const value = cell.getValue();
      // 대소문자 확인 필요
      return value === "W" ? "Web" : value === "M" ? "Mobile" : value;
      },
    },
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
        // 수정: errorMsgPopup 제거, 데이터 비움
        setData([]);
        return;
      }
      if (response.errMsg !== "") {
        // 수정: errorMsgPopup 제거, 데이터 비움
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
        return {
          MONTH: item.MONTH || "",
          DATE: item.DATE ? item.DATE.substring(0, 10) : "",
          EMPNO: item.EMPNO || "",
          EMPNM: item.EMPNM || "",
          USERIP: item.USERIP || "",
          LOGIN_STATUS: item.USERCONGB || "",
        };
      });
      setData(mappedData);
      console.log("Mapped data:", mappedData);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      // 수정: errorMsgPopup 제거, 데이터 비움
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

  // 필터 기능
  useEffect(() => {
    if (isInitialRender.current || !tableInstance.current || tableStatus !== "ready" || loading) return;
    const { filterSelect, filterText } = tableFilters;
    if (filterText && filterSelect) {
      tableInstance.current.setFilter(filterSelect, "like", filterText);
    } else if (filterText) {
      tableInstance.current.setFilter(
        [
          { field: "MONTH", type: "like", value: filterText },
          { field: "DATE", type: "like", value: filterText },
          { field: "EMPNO", type: "like", value: filterText },
          { field: "EMPNM", type: "like", value: filterText },
          { field: "USERIP", type: "like", value: filterText },
          { field: "LOGIN_STATUS", type: "like", value: filterText },
        ],
        "or"
      );
    } else {
      tableInstance.current.clearFilter();
    }
  }, [tableFilters.filterSelect, tableFilters.filterText, tableStatus, loading]);

  //DB 없는 월 오류 alert 제거
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
        // 수정: alert 제거 및 데이터 클리어
        table.clearData();
      } else {
        table.clearAlert(); // 기존 alert 제거
        setRowCount(table.getDataCount());
      }
    } else {
      console.warn("renderer가 아직 초기화되지 않았습니다.");
    }
  }, [data, loading, tableStatus, isSearched]);

  return (
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
  );
};

export default LoginHistory;
