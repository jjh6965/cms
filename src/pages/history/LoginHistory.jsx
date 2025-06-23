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
// 2025-06-23: 추가: 등록 팝업과 메시지 팝업을 위한 컴포넌트 및 유틸리티 import
import CommonPopup from "../../components/popup/CommonPopup";
import { errorMsgPopup } from "../../utils/errorMsgPopup";
import { msgPopup } from "../../utils/msgPopup";

const LoginHistory = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [tableFilters, setTableFilters] = useState({});
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
  // 2025-06-23: 추가: 등록 팝업에서 사용할 오늘 날짜
  const todayDate = today.toISOString().slice(0, 10);

  // 2025-06-23: 추가: 등록 팝업에서 사용할 입력 데이터 상태
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [insertData, setInsertData] = useState({
    month: todayMonth,
    date: todayDate,
    empNo: user?.empNo || "defaultEmpNo",
    userIp: "",
    loginStatus: "W",
  });

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
          // 2025-06-23: 추가: 초기화 버튼 활성화
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
    // 2025-06-23: 추가: 필터 변경 시 등록 데이터의 월 동기화
    if (filters.month) {
      setInsertData((prev) => ({ ...prev, month: filters.month }));
    }
  }, [filters]);

  useEffect(() => {
    if (!user || !hasPermission(user.auth, "loginHistory")) navigate("/");
  }, [user, navigate]);

  const columns = [
    { title: "월", field: "MONTH", width: 100, headerHozAlign: "center", hozAlign: "center" },
    { title: "일자", field: "DATE", width: 150, headerHozAlign: "center", hozAlign: "center" },
    { title: "사원번호", field: "EMPNO", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "이름", field: "EMPNM", width: 120, headerHozAlign: "center", hozAlign: "center" },
    { title: "사용자IP", field: "USERIP", width: 150, headerHozAlign: "center", hozAlign: "center" },
    {
      title: "구분(Web/Mobile)",
      field: "LOGIN_STATUS",
      width: 150,
      headerHozAlign: "center",
      hozAlign: "center",
      formatter: (cell) => {
        const value = cell.getValue();
        return value === "W" ? "Web" : value === "M" ? "Mobile" : value;
      },
    },
    // 2025-06-23: 추가: 삭제 버튼 열 추가
    // 2025-06-23 Fix: window.handleDeleteRow 대신 React 이벤트 핸들러 사용
    {
      title: "",
      field: "delete",
      width: 50,
      headerHozAlign: "center",
      hozAlign: "center",
      formatter: (cell) => {
        const rowData = cell.getRow().getData();
        const button = document.createElement("button");
        button.className = styles.deleteBtn;
        button.textContent = "삭제";
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          handleDelete(rowData.EMPNO, rowData.DATE);
        });
        return button;
      },
    },
  ];

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
      console.log("Fetch Response:", response);
      if (!response.success) {
        console.log("API Failure:", response.errMsg);
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
    // 2025-06-23: 추가: 등록 이벤트 처리
    } else if (eventType === "register") {
      setIsPopupOpen(true);
    }
    // 2025-06-23: 주석: 저장 버튼 이벤트는 팝업 내에서 처리하므로 여기서 제거
  }; //필터 수정: 검색 및 초기화 로직 처리

  // 2025-06-23: 추가: 등록 데이터 저장 처리 함수
  const handleSave = async () => {
    const currentFilters = latestFiltersRef.current;
    if (!insertData.empNo || !insertData.date || !insertData.userIp || !insertData.loginStatus) {
      errorMsgPopup("필수 입력값을 모두 입력하세요.");
      return;
    }
    if (insertData.month !== currentFilters.month) {
      errorMsgPopup(`선택된 월(${currentFilters.month})에 맞는 데이터를 등록해야 합니다.`);
      return;
    }
    setLoading(true);
    try {
      const saveData = {
        empNo: insertData.empNo,
        userIp: insertData.userIp,
        userCongb: insertData.loginStatus,
        dbCreatedDt: `${insertData.date} 00:00:00`,
        debug: "F",
      };
      console.log("Sending save data:", saveData);
      const response = await fetchData(api, `${common.getServerUrl("history/login/insert")}`, saveData, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      console.log("API response:", response);
      if (response.success) {
        await loadData();
        setIsPopupOpen(false);
        setInsertData({
          month: currentFilters.month,
          date: todayDate,
          empNo: user?.empNo || "defaultEmpNo",
          userIp: "",
          loginStatus: "W",
        });
        msgPopup("데이터가 성공적으로 저장되었습니다.");
      } else {
        errorMsgPopup(`저장 실패: ${response.errMsg}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      errorMsgPopup("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2025-06-23: 추가: 삭제 처리 함수
  // 2025-06-23 Fix: buttonElement 매개변수 제거 (더 이상 필요하지 않음)
  const handleDelete = async (empNo, date) => {
    const row = tableInstance.current.getRows().find((r) => r.getData().EMPNO === empNo && r.getData().DATE === date);
    if (!row) {
      errorMsgPopup("삭제할 행을 찾을 수 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const deleteData = {
        empNo,
        dbCreatedDt: `${date} 00:00:00`,
        debug: "F",
      };
      console.log("Sending delete data:", deleteData);
      const response = await fetchData(api, `${common.getServerUrl("history/login/delete")}`, deleteData, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (response.success) {
        // 행 즉시 삭제
        tableInstance.current.deleteRow(row);
        msgPopup("삭제 성공");
        // 서버와 동기화 위해 데이터 새로고침
        await loadData();
      } else {
        errorMsgPopup("삭제 실패: " + response.errMsg);
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      errorMsgPopup("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeTable = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!tableRef.current) {
        // 수정: errorMsgPopup 제거
        setError("테이블 컨테이너를 초기화할 수 없습니다.");
        return;
      }
      try {
        // 2025-06-23 Fix: rowClick 이벤트 제거 (selectedRow 사용 안 함)
        tableInstance.current = createTable(tableRef.current, columns, [], {});
        if (!tableInstance.current) throw new Error("createTable returned undefined or null");
        setTableStatus("ready");
      } catch (err) {
        setTableStatus("error");
        setError("테이블 초기화에 실패했습니다: " + err.message);
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
        filterFields={filterTableFields}
        filters={tableFilters}
        setFilters={setTableFilters}
        onDownloadExcel={() => handleDownloadExcel(tableInstance.current, tableStatus, "로그인_이력.xlsx")}
        rowCount={rowCount}
        onEvent={handleDynamicEvent}
      >
        {/* 2025-06-23: 추가: 등록 버튼 추가, 저장 버튼은 팝업에서 처리하므로 제거 */}
        {/* 2025-06-23 Fix: 불필요한 저장 버튼 제거 */}
        <div className={styles.btnGroupCustom}>
          <button className={`${styles.btn} text-bg-success`} onClick={() => handleDynamicEvent("register")}>
            등록
          </button>
        </div>
      </TableSearch>
      <div className={styles.tableWrapper}>
        {tableStatus === "initializing" && <div>초기화 중...</div>}
        {loading && <div>로딩 중...</div>}
        <div
          ref={tableRef}
          className={styles.tableSection}
          style={{ visibility: loading || tableStatus !== "ready" ? "hidden" : "visible" }}
        />
      </div>
      {/* 2025-06-23: 추가: 등록 팝업 컴포넌트 */}
      <CommonPopup
        show={isPopupOpen}
        onHide={() => setIsPopupOpen(false)}
        onConfirm={handleSave}
        title="로그인 이력 등록"
      >
        <div>
          <div className="mb-3">
            <label htmlFor="monthInput" className="form-label">월:</label>
            <input
              type="text"
              id="monthInput"
              className="form-control"
              value={insertData.month}
              onChange={(e) => setInsertData((prev) => ({ ...prev, month: e.target.value }))}
              placeholder="예: 2025-06"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="dateInput" className="form-label">일자:</label>
            <input
              type="date"
              id="dateInput"
              className="form-control"
              value={insertData.date}
              onChange={(e) => setInsertData((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="empNoInput" className="form-label">사원번호:</label>
            <input
              type="text"
              id="empNoInput"
              className="form-control"
              value={insertData.empNo}
              onChange={(e) => setInsertData((prev) => ({ ...prev, empNo: e.target.value }))}
              placeholder="사원번호 입력"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="userIpInput" className="form-label">사용자IP:</label>
            <input
              type="text"
              id="userIpInput"
              className="form-control"
              value={insertData.userIp}
              onChange={(e) => setInsertData((prev) => ({ ...prev, userIp: e.target.value }))}
              placeholder="IP 입력"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="loginStatusSelect" className="form-label">구분(Web/Mobile):</label>
            <select
              id="loginStatusSelect"
              className="form-select"
              value={insertData.loginStatus}
              onChange={(e) => setInsertData((prev) => ({ ...prev, loginStatus: e.target.value }))}
            >
              <option value="W">Web</option>
              <option value="M">Mobile</option>
            </select>
          </div>
        </div>
      </CommonPopup>
    </div>
  );
};

export default LoginHistory;