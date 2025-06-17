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

  const today = new Date(); // 수정: 고정된 날짜 대신 현재 날짜 사용
  const todayMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}`;

  //조회 기능
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

  //필터 기능
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
        { value: "USERCONGB", label: "구분(Web/Mobile)" },
        { value: "JOBNM", label: "작업명" },
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
    { title: "일자", field: "DATE", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "사원번호", field: "EMPNO", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "이름", field: "EMPNM", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "사용자IP", field: "USERIP", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "구분(Web/Mobile)", field: "USERCONGB", width: 150, headerHozAlign: "center", hozAlign: "center",
      formatter: (cell) => { // w를 Web, m을 Mobile로 변환
      const value = cell.getValue();
      // 타입 비교로 대소문자 확인 필요
      return value === "W" ? "Web" : value === "M" ? "Mobile" : value; } },
      // 컬럼 값이 다 안보여 width : 150 -> 300 수정, hozAlign : 좌측 정렬
    { title: "작업명", field: "JOBNM", width: 300, headerHozAlign: "center", hozAlign: "left" },
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
      // 수정: errorMsgPopup 제거, 데이터 비움
      setData([]);
      return;
    }
    const mappedData = (response.data || []).map((item) => ({
      MONTH: item.MONTH || "",
      DATE: item.DATE ? item.DATE.substring(0, 10) : "",
      EMPNO: item.EMPNO || "",
      EMPNM: item.EMPNM || "",
      USERIP: item.USERIP || "",
      USERCONGB: item.USERCONGB || "",
      JOBNM: item.JOBNM || "",
    }));
    setData(mappedData);
  } catch (err) {
    console.error("데이터 로드 실패:", err);
    // 수정: errorMsgPopup 제거, 데이터 비움
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
        { field: "MONTH", type: "like", value: filterText },
        { field: "DATE", type: "like", value: filterText },
        { field: "EMPNO", type: "like", value: filterText },
        { field: "EMPNM", type: "like", value: filterText },
        { field: "USERIP", type: "like", value: filterText },
        { field: "USERCONGB", type: "like", value: filterText },
        { field: "JOBNM", type: "like", value: filterText },
      ],
      "or"
    );
  } else {
    tableInstance.current.clearFilter();
  }
}, [tableFilters.filterSelect, tableFilters.filterText, tableStatus, loading]);

  return (
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
  );
};

export default DbFileWorkHistoryNew;
