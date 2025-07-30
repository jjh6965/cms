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
import CommonPopup from "../../components/popup/CommonPopup";
import { fetchData } from "../../utils/dataUtils";
import api from "../../utils/api";
import common from "../../utils/common";
import { errorMsgPopup } from "../../utils/errorMsgPopup";
import { msgPopup } from "../../utils/msgPopup";

// 검색 필드 옵션 정의
const getFieldOptions = (fieldId) => {
  const optionsMap = {
    STATUS: [
      { value: "", label: "전체" },
      { value: "사용 중", label: "사용 중" },
      { value: "예약 가능", label: "예약 가능" },
      { value: "예약 완료", label: "예약 완료" },
    ],
    GENDER: [
      { value: "Male", label: "남성" },
      { value: "Female", label: "여성" },
    ],
    DURATION: [
      { value: 1, label: "1개월" },
      { value: 6, label: "6개월" },
      { value: 12, label: "12개월" },
    ],
    ROOM_TYPE: [
      { value: "1인실", label: "1인실" }, // CSV 기반 초기값, 동적 로드 필요
    ],
  };
  return optionsMap[fieldId] || [];
};

// 동적 옵션 로드 함수
const fetchFieldOptions = async (fieldId, endpoint, user) => {
  try {
    const params = {
      p_NAME: "",
      p_STATUS: "",
      p_FLOOR_ID: "",
      p_SECTION: "",
      p_DEBUG: "F",
    };
    console.log("Params before fetchData in fetchFieldOptions:", params);
    const response = await fetchData(api, endpoint, params);
    console.log("Response from fetchData in fetchFieldOptions:", response);
    if (!response.success || response.errCd !== "00") {
      throw new Error(response.errMsg || `Failed to load ${fieldId} options`);
    }
    return Array.isArray(response.data)
      ? response.data.map((item) => ({ value: item[fieldId] || item, label: item[fieldId] || item }))
      : [];
  } catch (err) {
    console.error(`Failed to load ${fieldId} options:`, err);
    errorMsgPopup(`Failed to load ${fieldId} options: ${err.message}`);
    return [];
  }
};

// 검색 설정
const searchConfig = {
  areas: [
    {
      type: "search",
      fields: [
        {
          id: "NAME",
          type: "text",
          row: 1,
          label: "예약자 이름",
          labelVisible: true,
          placeholder: "예약자 이름 입력",
          width: "200px",
          height: "30px",
          backgroundColor: "#ffffff",
          color: "#000000",
          enabled: true,
        },
        {
          id: "STATUS",
          type: "select",
          row: 1,
          label: "상태",
          labelVisible: true,
          options: [
            { value: "", label: "전체" },
            { value: "사용 중", label: "사용 중" },
            { value: "예약 가능", label: "예약 가능" },
            { value: "취소", label: "취소" },
          ],
          width: "150px",
          height: "30px",
          backgroundColor: "#ffffff",
          color: "#000000",
          enabled: true,
        },
        {
          id: "FLOOR_ID",
          type: "text",
          row: 2,
          label: "층 ID",
          labelVisible: true,
          placeholder: "층 ID 입력 (예: 1F)",
          width: "150px",
          height: "30px",
          backgroundColor: "#ffffff",
          color: "#000000",
          enabled: true,
        },
        {
          id: "SECTION",
          type: "select",
          row: 2,
          label: "섹션",
          labelVisible: true,
          options: [
            { value: "", label: "전체" },
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
          ],
          width: "150px",
          height: "30px",
          backgroundColor: "#ffffff",
          color: "#000000",
          enabled: true,
        },
      ],
    },
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
        },
      ],
    },
  ],
};

// 테이블 필터 필드 설정
const filterTableFields = [
  {
    id: "filterSelect",
    label: "",
    type: "select",
    options: [
      { value: "", label: "선택" },
      { value: "RESERVATION_ID", label: "예약 ID" },
      { value: "ROOM_ID", label: "호실 ID" },
      { value: "USER_ID", label: "사용자 ID" },
      { value: "ROOM_TYPE", label: "호실 유형" },
      { value: "NAME", label: "예약자 이름" },
      { value: "GENDER", label: "성별" },
      { value: "PHONE", label: "전화번호" },
      { value: "RESERVATION_DATE", label: "예약 날짜" },
      { value: "DURATION", label: "기간(개월)" },
      { value: "STATUS", label: "상태" },
      { value: "EMP_NO", label: "직원 번호" },
    ],
    width: "auto",
  },
  {
    id: "filterText",
    label: "",
    type: "text",
    placeholder: "검색값을 입력하세요",
    width: "200px",
  },
];

const ReservationManage = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const tableInstance = useRef(null);
  const isInitialRender = useRef(true);

  const [filters, setFilters] = useState(initialFilters(searchConfig.areas.find((area) => area.type === "search").fields));
  const [tableFilters, setTableFilters] = useState(initialFilters(filterTableFields));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableStatus, setTableStatus] = useState("initializing");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newRowData, setNewRowData] = useState({
    RESERVATION_ID: "",
    ROOM_ID: "",
    USER_ID: user?.id || "admin",
    ROOM_TYPE: "1인실",
    NAME: "",
    GENDER: "Male",
    PHONE: "",
    RESERVATION_DATE: new Date().toISOString().split("T")[0],
    DURATION: 1,
    STATUS: "",
    EMP_NO: user?.emp_no || "admin",
  });
  const [rowCount, setRowCount] = useState(0);
  const [isSearched, setIsSearched] = useState(false);
  const [roomTypeOptions, setRoomTypeOptions] = useState(getFieldOptions("ROOM_TYPE"));

  // 테이블 셀 편집기 설정
  const fn_CellText = { editor: "input", editable: true };
  const fn_CellNumber = { editor: "number", editorParams: { min: 0 }, editable: true };
  const fn_CellSelect = (values) => ({ editor: "list", editorParams: { values, autocomplete: true }, editable: true });
  const fn_CellButton = (label, className, onClick) => ({
    formatter: (cell) => {
      const button = document.createElement("button");
      button.className = `btn btn-sm ${className}`;
      button.innerText = label;
      button.onclick = () => onClick(cell.getData());
      return button;
    },
  });

  // 셀 편집 처리 함수
  const fn_HandleCellEdit = (cell, field) => {
    const rowId = cell.getRow().getData().RESERVATION_ID;
    const newValue = cell.getValue();
    setTimeout(() => {
      setData((prevData) =>
        prevData.map((row) => {
          if (String(row.RESERVATION_ID) === String(rowId)) {
            const updatedRow = { ...row, [field]: newValue };
            if (updatedRow.is_deleted === "N" && updatedRow.is_added === "N") {
              updatedRow.is_changed = "Y";
            }
            return updatedRow;
          }
          return row;
        })
      );
      if (tableInstance.current) tableInstance.current.redraw();
    }, 0);
  };

  // 호실 삭제 처리 함수
  const handleDelete = (rowData) => {
    if (!rowData || !rowData.RESERVATION_ID) {
      errorMsgPopup("삭제할 데이터가 없습니다.");
      return;
    }
    if (rowData.STATUS === "사용 중") {
      errorMsgPopup("사용 중인 예약은 삭제할 수 없습니다.");
      return;
    }
    const table = tableInstance.current;
    if (table) {
      const row = table.getRows().find((r) => r.getData().RESERVATION_ID === rowData.RESERVATION_ID);
      if (row) {
        row.select();
      }
    }
    setTimeout(() => {
      if (rowData.is_added === "Y") {
        setData((prevData) => prevData.filter((r) => r.RESERVATION_ID !== rowData.RESERVATION_ID));
      } else {
        setData((prevData) =>
          prevData.map((r) => (r.RESERVATION_ID === rowData.RESERVATION_ID ? { ...r, is_deleted: "Y", is_changed: "N" } : r))
        );
      }
      if (tableInstance.current) tableInstance.current.redraw();
    }, 0);
  };

  // 권한 체크
  useEffect(() => {
    if (!user || !hasPermission(user.auth, "reservationManage")) {
      console.log("Redirecting due to missing user or reservationManage permission");
      navigate("/");
    }
  }, [user, navigate]);

  // 동적 옵션 로드
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const roomTypes = await fetchFieldOptions("ROOM_TYPE", `${common.getServerUrl("reservation/reservation/list")}`, user);
        setRoomTypeOptions(roomTypes.length > 0 ? roomTypes : getFieldOptions("ROOM_TYPE"));
      } catch (err) {
        console.error("Failed to load room types:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, [user]);

  // 테이블 초기화
  useEffect(() => {
    const initializeTable = async () => {
      if (!tableRef.current) {
        errorMsgPopup("테이블 컨테이너를 초기화할 수 없습니다.");
        return;
      }
      try {
        tableInstance.current = createTable(
          tableRef.current,
          [
            {
              frozen: true,
              headerHozAlign: "center",
              hozAlign: "center",
              title: "작업",
              field: "actions",
              width: 80,
              visible: true,
              ...fn_CellButton("삭제", `btn-danger ${styles.deleteButton}`, handleDelete),
            },
            {
              frozen: true,
              headerHozAlign: "center",
              hozAlign: "center",
              title: "작업대상",
              field: "applyTarget",
              sorter: "string",
              width: 100,
              formatter: (cell) => {
                const rowData = cell.getRow().getData();
                let label = "";
                let stateField = "";
                if (rowData.is_deleted === "Y") {
                  label = "삭제";
                  stateField = "is_deleted";
                } else if (rowData.is_added === "Y") {
                  label = "추가";
                  stateField = "is_added";
                } else if (rowData.is_changed === "Y") {
                  label = "변경";
                  stateField = "is_changed";
                }
                if (!label) return "";
                const div = document.createElement("div");
                div.style.display = "flex";
                div.style.alignItems = "center";
                div.style.justifyContent = "center";
                div.style.gap = "5px";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = rowData[stateField] === "Y";
                checkbox.onclick = () => {
                  setTimeout(() => {
                    setData((prevData) =>
                      prevData
                        .map((row) => {
                          if (row.RESERVATION_ID === rowData.RESERVATION_ID) {
                            const updatedRow = { ...row, [stateField]: checkbox.checked ? "Y" : "N" };
                            if (stateField === "is_deleted" && !checkbox.checked) updatedRow.is_changed = "N";
                            if (stateField === "is_added" && !checkbox.checked) return null;
                            return updatedRow;
                          }
                          return row;
                        })
                        .filter(Boolean)
                    );
                    if (tableInstance.current) tableInstance.current.redraw();
                  }, 0);
                };
                const span = document.createElement("span");
                span.innerText = label;
                div.appendChild(checkbox);
                div.appendChild(span);
                return div;
              },
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "예약 ID",
              field: "RESERVATION_ID",
              sorter: "string",
              width: 120,
              editable: false,
            },
            {
              headerHozAlign: "center",
              hozAlign: "left",
              title: "호실 ID",
              field: "ROOM_ID",
              sorter: "string",
              width: 100,
              editor: "input",
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "ROOM_ID"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "left",
              title: "호실 유형",
              field: "ROOM_TYPE",
              sorter: "string",
              width: 100,
              editor: "list",
              editorParams: { values: roomTypeOptions.map((opt) => opt.value) },
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "ROOM_TYPE"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "left",
              title: "예약자 이름",
              field: "NAME",
              sorter: "string",
              width: 120,
              editor: "input",
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "NAME"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "성별",
              field: "GENDER",
              sorter: "string",
              width: 80,
              editor: "list",
              editorParams: { values: getFieldOptions("GENDER").map((opt) => opt.value) },
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "GENDER"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "left",
              title: "전화번호",
              field: "PHONE",
              sorter: "string",
              width: 120,
              editor: "input",
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "PHONE"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "예약 날짜",
              field: "RESERVATION_DATE",
              sorter: "string",
              width: 120,
              editor: "input",
              editorParams: { type: "date" },
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "RESERVATION_DATE"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "기간(개월)",
              field: "DURATION",
              sorter: "number",
              width: 100,
              editor: "list",
              editorParams: { values: getFieldOptions("DURATION").map((opt) => opt.value) },
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "DURATION"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "상태",
              field: "STATUS",
              sorter: "string",
              width: 100,
              editor: "list",
              editorParams: { values: getFieldOptions("STATUS").map((opt) => opt.value) },
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "STATUS"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "직원 번호",
              field: "EMP_NO",
              sorter: "string",
              width: 100,
              editor: "input",
              editable: true,
              cellEdited: (cell) => fn_HandleCellEdit(cell, "EMP_NO"),
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "생성일시",
              field: "CREATED_AT",
              sorter: "string",
              width: 150,
              editable: false,
            },
            {
              headerHozAlign: "center",
              hozAlign: "center",
              title: "수정일시",
              field: "UPDATED_AT",
              sorter: "string",
              width: 150,
              editable: false,
            },
          ],
          [],
          {
            editable: true,
            rowFormatter: (row) => {
              const data = row.getData();
              const el = row.getElement();
              el.classList.remove(styles.deletedRow, styles.addedRow, styles.editedRow);
              if (data.is_deleted === "Y") el.classList.add(styles.deletedRow);
              else if (data.is_added === "Y") el.classList.add(styles.addedRow);
              else if (data.is_changed === "Y") el.classList.add(styles.editedRow);
            },
          }
        );
        setTableStatus("ready");
      } catch (err) {
        setTableStatus("error");
        errorMsgPopup("테이블 초기화에 실패했습니다: " + err.message);
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

  // 데이터 로드
  const handleSearch = async () => {
    setLoading(true);
    setIsSearched(true);
    try {
      const params = {
        p_NAME: filters.NAME || "",
        p_STATUS: filters.STATUS || "",
        p_FLOOR_ID: filters.FLOOR_ID || "",
        p_SECTION: filters.SECTION || "",
        p_DEBUG: "F",
      };
      console.log("Search params:", params);
      const response = await fetchData(api, `${common.getServerUrl("reservation/reservation/list")}`, params);
      console.log("Search response:", response);
      if (!response.success) {
        errorMsgPopup(response.message || "예약 데이터를 가져오는 중 오류가 발생했습니다.");
        setData([]);
        return;
      }
      if (response.errMsg && response.errCd !== "00") {
        errorMsgPopup(response.errMsg);
        setData([]);
        return;
      }
      const responseData = Array.isArray(response.data)
        ? response.data.map((row) => ({ ...row, is_changed: "N", is_added: "N", is_deleted: "N" }))
        : [];
      setData(responseData);
    } catch (err) {
      errorMsgPopup(err.response?.data?.message || "예약 데이터를 가져오는 중 오류가 발생했습니다.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 테이블 데이터 업데이트
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const table = tableInstance.current;
    if (!table || tableStatus !== "ready" || loading) return;
    table.setData(data);
    if (isSearched && data.length === 0 && !loading) {
      table.alert("검색 결과 없음", "info");
    } else {
      table.clearAlert();
      setRowCount(table.getDataCount());
    }
  }, [data, tableStatus, loading, isSearched]);

  // 테이블 필터 적용
  useEffect(() => {
    if (!tableInstance.current || tableStatus !== "ready" || loading) return;
    const { filterSelect, filterText } = tableFilters;
    if (filterText && filterSelect) {
      tableInstance.current.setFilter(filterSelect, "like", filterText);
    } else if (filterText) {
      if (filterText !== "") {
        tableInstance.current.setFilter(
          [
            { field: "RESERVATION_ID", type: "like", value: filterText },
            { field: "ROOM_ID", type: "like", value: filterText },
            { field: "USER_ID", type: "like", value: filterText },
            { field: "ROOM_TYPE", type: "like", value: filterText },
            { field: "NAME", type: "like", value: filterText },
            { field: "GENDER", type: "like", value: filterText },
            { field: "PHONE", type: "like", value: filterText },
            { field: "RESERVATION_DATE", type: "like", value: filterText },
            { field: "DURATION", type: "like", value: filterText },
            { field: "STATUS", type: "like", value: filterText },
            { field: "EMP_NO", type: "like", value: filterText },
          ],
          "or"
        );
      } else {
        tableInstance.current.clearFilter();
      }
    } else {
      tableInstance.current.clearFilter();
    }
  }, [tableFilters, tableStatus, loading]);

  // 검색 이벤트 처리
  const handleDynamicEvent = (eventType) => {
    if (eventType === "search") handleSearch();
  };

  // 예약 추가 팝업 열기
  const handleAddClick = () => setShowAddPopup(true);

  // 예약 추가 확인
  const handleAddConfirm = () => {
    if (!newRowData.ROOM_ID || !newRowData.NAME) {
      errorMsgPopup("호실 ID와 예약자 이름은 필수 입력 항목입니다.");
      return;
    }
    const newRow = {
      RESERVATION_ID: `TEMP_${Date.now()}`,
      ...newRowData,
      CREATED_AT: new Date().toISOString().slice(0, 19).replace("T", " "),
      UPDATED_AT: new Date().toISOString().slice(0, 19).replace("T", " "),
      is_deleted: "N",
      is_changed: "N",
      is_added: "Y",
    };
    setData((prevData) => [newRow, ...prevData]);
    setShowAddPopup(false);
    setNewRowData({
      RESERVATION_ID: "",
      ROOM_ID: "",
      USER_ID: user?.id || "admin",
      ROOM_TYPE: "1인실",
      NAME: "",
      GENDER: "Male",
      PHONE: "",
      RESERVATION_DATE: new Date().toISOString().split("T")[0],
      DURATION: 1,
      STATUS: "",
      EMP_NO: user?.emp_no || "admin",
    });
    if (tableInstance.current) tableInstance.current.redraw();
  };

  // 예약 추가 취소
  const handleAddCancel = () => {
    setShowAddPopup(false);
    setNewRowData({
      RESERVATION_ID: "",
      ROOM_ID: "",
      USER_ID: user?.id || "admin",
      ROOM_TYPE: "1인실",
      NAME: "",
      GENDER: "Male",
      PHONE: "",
      RESERVATION_DATE: new Date().toISOString().split("T")[0],
      DURATION: 1,
      STATUS: "",
      EMP_NO: user?.emp_no || "admin",
    });
  };

  // 저장 처리
  const handleSave = async () => {
    const changedRows = data.filter((row) => row.is_deleted === "Y" || row.is_added === "Y" || row.is_changed === "Y");
    if (changedRows.length === 0) {
      errorMsgPopup("변경된 데이터가 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const promises = changedRows.map(async (row) => {
        const PGUBUN = row.is_deleted === "Y" ? "D" : row.is_added === "Y" ? "I" : "U";
        const params = {
          PGUBUN: PGUBUN,
          PRESERVATION_ID: row.RESERVATION_ID,
          PROOM_ID: row.ROOM_ID || "",
          PUSER_ID: row.USER_ID || "admin",
          PROOM_TYPE: row.ROOM_TYPE || "1인실",
          PNAME: row.NAME || "",
          PGENDER: row.GENDER || "Male",
          PPHONE: row.PHONE || "",
          PRESERVATION_DATE: row.RESERVATION_DATE || new Date().toISOString().split("T")[0],
          PDURATION: row.DURATION || 1,
          PSTATUS: row.STATUS || "",
          PEMP_NO: row.EMP_NO || user?.emp_no || "admin",
          P_DEBUG: "F",
        };
        try {
          const response = await fetchData(api, `${common.getServerUrl("reservation/reservation/save")}`, params);
          if (!response.success || response.errCd !== "00") {
            throw new Error(response.errMsg || `Failed to process reservation ${row.RESERVATION_ID}`);
          }
          return { ...row, success: true, message: response.errMsg || "성공" };
        } catch (error) {
          console.error(`Error processing ${PGUBUN} for RESERVATION_ID: ${row.RESERVATION_ID}`, error);
          return { ...row, success: false, error: error.message };
        }
      });
      const results = await Promise.all(promises);
      const errors = results.filter((result) => !result.success);
      if (errors.length > 0) {
        errorMsgPopup(`일부 작업이 실패했습니다: ${errors.map((e) => e.error).join(", ")}`);
      } else {
        msgPopup("모든 변경사항이 성공적으로 저장되었습니다.");
        setData((prevData) => prevData.map((row) => ({ ...row, is_changed: "N", is_added: "N", is_deleted: "N" })));
        await handleSearch();
      }
    } catch (err) {
      errorMsgPopup(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <MainSearch config={searchConfig} filters={filters} setFilters={setFilters} onEvent={handleDynamicEvent} />
      <TableSearch
        filterFields={filterTableFields}
        filters={tableFilters}
        setFilters={setTableFilters}
        rowCount={rowCount}
        onDownloadExcel={() => handleDownloadExcel(tableInstance.current, tableStatus, "예약관리.xlsx")}
        buttonStyles={styles}
      >
        <div className={styles.btnGroupCustom}>
          <button className={`${styles.btn} text-bg-primary`} onClick={handleAddClick}>
            추가
          </button>
          <button className={`${styles.btn} text-bg-success`} onClick={handleSave}>
            저장
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
      <CommonPopup show={showAddPopup} onHide={handleAddCancel} onConfirm={handleAddConfirm} title="예약 추가">
        <div className="mb-3">
          <label className="form-label">예약 ID</label>
          <input
            type="text"
            className={`form-control ${styles.formControl}`}
            placeholder="예약 ID 입력"
            value={newRowData.RESERVATION_ID}
            onChange={(e) => setNewRowData({ ...newRowData, RESERVATION_ID: e.target.value })}
            disabled
          />
        </div>
        <div className="mb-3">
          <label className="form-label">호실 ID</label>
          <input
            type="text"
            className={`form-control ${styles.formControl}`}
            placeholder="호실 ID 입력"
            value={newRowData.ROOM_ID}
            onChange={(e) => setNewRowData({ ...newRowData, ROOM_ID: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">호실 유형</label>
          <select
            className={`form-select ${styles.formSelect}`}
            value={newRowData.ROOM_TYPE}
            onChange={(e) => setNewRowData({ ...newRowData, ROOM_TYPE: e.target.value })}
          >
            <option value="">선택하세요</option>
            {roomTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">예약자 이름</label>
          <input
            type="text"
            className={`form-control ${styles.formControl}`}
            placeholder="예약자 이름 입력"
            value={newRowData.NAME}
            onChange={(e) => setNewRowData({ ...newRowData, NAME: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">성별</label>
          <select
            className={`form-select ${styles.formSelect}`}
            value={newRowData.GENDER}
            onChange={(e) => setNewRowData({ ...newRowData, GENDER: e.target.value })}
          >
            {getFieldOptions("GENDER").map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">전화번호</label>
          <input
            type="text"
            className={`form-control ${styles.formControl}`}
            placeholder="전화번호 입력 (예: 010-1234-5678)"
            value={newRowData.PHONE}
            onChange={(e) => setNewRowData({ ...newRowData, PHONE: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">예약 날짜</label>
          <input
            type="date"
            className={`form-control ${styles.formControl}`}
            value={newRowData.RESERVATION_DATE}
            onChange={(e) => setNewRowData({ ...newRowData, RESERVATION_DATE: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">기간(개월)</label>
          <select
            className={`form-select ${styles.formSelect}`}
            value={newRowData.DURATION}
            onChange={(e) => setNewRowData({ ...newRowData, DURATION: parseInt(e.target.value) })}
          >
            {getFieldOptions("DURATION").map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">상태</label>
          <select
            className={`form-select ${styles.formSelect}`}
            value={newRowData.STATUS}
            onChange={(e) => setNewRowData({ ...newRowData, STATUS: e.target.value })}
          >
            {getFieldOptions("STATUS").map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">직원 번호</label>
          <input
            type="text"
            className={`form-control ${styles.formControl}`}
            placeholder="직원 번호 입력"
            value={newRowData.EMP_NO}
            onChange={(e) => setNewRowData({ ...newRowData, EMP_NO: e.target.value })}
          />
        </div>
      </CommonPopup>
    </div>
  );
};

export default ReservationManage;
