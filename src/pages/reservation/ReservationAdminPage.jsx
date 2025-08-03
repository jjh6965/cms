/**
 * 파일: ReservationAdminPage.jsx
 * 설명: 관리자용 예약 레이아웃 관리 페이지
 * 목적: 층별 섹션 및 호실 정보를 테이블과 클릭 가능한 그리드 UI로 관리
 * 한글 주석: 관리자가 층, 섹션, 호실 유형을 설정하고 DB에 저장하며, 섹션별 호실 크기 합계가 8을 초과하지 않도록 검증
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { hasPermission } from "../../utils/authUtils";
import CommonPopup from "../../components/popup/CommonPopup";
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
import { msgPopup } from "../../utils/msgPopup";

// 테이블 셀 편집기 설정
const fn_CellText = { editor: "input", editable: true }; // 텍스트 입력 편집기 설정
const fn_CellNumber = { editor: "number", editorParams: { min: 0 }, editable: true }; // 숫자 입력 편집기 설정
const fn_CellSelect = (values) => ({ editor: "list", editorParams: { values, autocomplete: true }, editable: true }); // 드롭다운 선택 편집기 설정
const fn_CellButton = (label, className, onClick) => ({
  // 버튼 형식 편집기 설정
  formatter: (cell) => {
    const button = document.createElement("button");
    button.className = `btn btn-sm ${className}`;
    button.innerText = label;
    button.onclick = () => onClick(cell.getData());
    return button;
  },
});

// 셀 편집 처리 함수
const fn_HandleCellEdit = (cell, field, setData, tableInstance) => {
  // 셀 편집 후 데이터 업데이트
  const rowId = `${cell.getRow().getData().ROOM_ID}`;
  const newValue = cell.getValue();
  setTimeout(() => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.ROOM_ID === rowId) {
          const updatedRow = { ...row, [field]: newValue };
          if (updatedRow.isDeleted === "N" && updatedRow.isAdded === "N") {
            updatedRow.isChanged = "Y";
          }
          return updatedRow;
        }
        return row;
      })
    );
    if (tableInstance.current) tableInstance.current.redraw();
  }, 0);
};

// 필드 옵션 데이터 반환
const getFieldOptions = (fieldId) => {
  // 필드별 옵션 데이터 반환
  const optionsMap = {
    ROOM_TYPE: [
      { value: "", label: "전체" },
      { value: "1인실", label: "1인실" },
      { value: "2인실", label: "2인실" },
      { value: "4인실", label: "4인실" },
      { value: "8인실", label: "8인실" },
    ],
  };
  return optionsMap[fieldId] || [];
};

// 호실 크기 맵
const roomSizeMap = {
  "1인실": 1,
  "2인실": 2,
  "4인실": 4,
  "8인실": 8,
};

// 호실 크기 기반으로 colSpan과 rowSpan 계산
const calculateSpan = (roomType) => {
  // 호실 유형에 따른 그리드 스팬 계산
  const size = roomSizeMap[roomType] || 1;
  if (size === 1) return { colSpan: 1, rowSpan: 1 };
  if (size === 2) return { colSpan: 2, rowSpan: 1 }; // 기본값 2x1 (가로)
  if (size === 4) return { colSpan: 2, rowSpan: 2 }; // 기본값 2x2
  if (size === 8) return { colSpan: 2, rowSpan: 4 }; // 8인실 강제 2x4로 설정
  return { colSpan: 1, rowSpan: 1 };
};

// 레이아웃 관리 페이지 컴포넌트
const ReservationAdminPage = () => {
  const { user } = useStore();
  const navigate = useNavigate();

  // 검색 설정
  const searchConfig = {
    areas: [
      {
        type: "search",
        fields: [
          {
            id: "FLOOR_ID",
            type: "text",
            row: 1,
            label: "층 ID",
            labelVisible: true,
            placeholder: "층 ID 검색 (예: 1F)",
            width: "200px",
            height: "30px",
            backgroundColor: "#ffffff",
            color: "#000000",
            enabled: hasPermission(user?.auth, "admin"),
          },
          {
            id: "SECTION",
            type: "text",
            row: 1,
            label: "섹션",
            labelVisible: true,
            placeholder: "섹션 검색 (예: A)",
            width: "150px",
            height: "30px",
            backgroundColor: "#ffffff",
            color: "#000000",
            enabled: hasPermission(user?.auth, "admin"),
          },
          {
            id: "ROOM_TYPE",
            type: "select",
            row: 2,
            label: "호실 유형",
            labelVisible: true,
            options: getFieldOptions("ROOM_TYPE"),
            width: "200px",
            height: "30px",
            backgroundColor: "#ffffff",
            color: "#000000",
            enabled: hasPermission(user?.auth, "admin"),
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

  // 테이블 필터 설정
  const filterTableFields = [
    {
      id: "filterSelect",
      label: "",
      type: "select",
      options: [
        { value: "", label: "선택" },
        { value: "ROOM_ID", label: "호실 ID" },
        { value: "FLOOR_ID", label: "층 ID" },
        { value: "SECTION", label: "섹션" },
        { value: "ROOM_TYPE", label: "호실 유형" },
        { value: "PRICE", label: "호실 가격" },
        { value: "STATUS", label: "상태" },
      ],
    },
    {
      id: "filterText",
      label: "",
      type: "text",
      placeholder: "찾을 내용을 입력하세요",
      width: "200px",
    },
  ];

  // 상태 관리
  const [filters, setFilters] = useState(initialFilters(searchConfig.areas.find((area) => area.type === "search").fields)); // 검색 필터 상태
  const [tableFilters, setTableFilters] = useState(initialFilters(filterTableFields)); // 테이블 필터 상태
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [data, setData] = useState([]); // 데이터 상태
  const [isSearched, setIsSearched] = useState(false); // 검색 여부 상태
  const [tableStatus, setTableStatus] = useState("initializing"); // 테이블 상태
  const [showAddPopup, setShowAddPopup] = useState(false); // 추가 팝업 표시 상태
  const [imsiCounter, setImsiCounter] = useState(1); // 임시 카운터
  const [rowCount, setRowCount] = useState(0); // 행 수
  const [floors, setFloors] = useState([]); // 층 목록
  const [selectedFloor, setSelectedFloor] = useState(""); // 선택된 층
  const [sectionLayout, setSectionLayout] = useState({}); // 섹션 레이아웃 상태
  const [gridLayout, setGridLayout] = useState({}); // 그리드 레이아웃 상태
  const tableRef = useRef(null); // 테이블 참조
  const tableInstance = useRef(null); // 테이블 인스턴스 참조
  const isInitialRender = useRef(true); // 초기 렌더링 플래그
  const [newRowData, setNewRowData] = useState({
    // 새 행 데이터 초기값
    FLOOR_ID: "",
    SECTION: "",
    ROOM_TYPE: "1인실",
    PRICE: 0,
    ROOM_INDEX: 1,
  });
  const [dragState, setDragState] = useState({
    // 드래그 상태
    isDragging: false,
    startCell: null,
    endCell: null,
    section: null,
  });
  const [newFloorInput, setNewFloorInput] = useState(""); // 새 층 입력 상태

  // 테이블 컬럼 정의
  const columns = [
    {
      frozen: true,
      headerHozAlign: "center",
      hozAlign: "center",
      title: "작업",
      field: "actions",
      width: 80,
      visible: true,
      ...fn_CellButton("삭제", `btn-danger ${styles.deleteButton}`, (rowData) => handleDelete(rowData)),
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
        if (rowData.isDeleted === "Y") {
          label = "삭제";
          stateField = "isDeleted";
        } else if (rowData.isAdded === "Y") {
          label = "추가";
          stateField = "isAdded";
        } else if (rowData.isChanged === "Y") {
          label = "변경";
          stateField = "isChanged";
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
                  if (row.ROOM_ID === rowData.ROOM_ID) {
                    const updatedRow = { ...row, [stateField]: checkbox.checked ? "Y" : "N" };
                    if (stateField === "isDeleted" && !checkbox.checked) updatedRow.isChanged = "N";
                    if (stateField === "isAdded" && !checkbox.checked) return null;
                    return updatedRow;
                  }
                  return row;
                })
                .filter(Boolean)
            );
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
      title: "호실 ID",
      field: "ROOM_ID",
      sorter: "string",
      width: 120,
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "층 ID",
      field: "FLOOR_ID",
      sorter: "string",
      width: 100,
      ...fn_CellText,
      cellEdited: (cell) => fn_HandleCellEdit(cell, "FLOOR_ID", setData, tableInstance),
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "섹션",
      field: "SECTION",
      sorter: "string",
      width: 80,
      ...fn_CellText,
      cellEdited: (cell) => fn_HandleCellEdit(cell, "SECTION", setData, tableInstance),
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "호실 유형",
      field: "ROOM_TYPE",
      sorter: "string",
      width: 120,
      ...fn_CellSelect(["1인실", "2인실", "4인실", "8인실"]),
      cellEdited: (cell) => fn_HandleCellEdit(cell, "ROOM_TYPE", setData, tableInstance),
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "호실 가격",
      field: "PRICE",
      sorter: "number",
      width: 120,
      ...fn_CellNumber,
      cellEdited: (cell) => fn_HandleCellEdit(cell, "PRICE", setData, tableInstance),
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "상태",
      field: "STATUS",
      sorter: "string",
      width: 100,
      ...fn_CellSelect(["사용 가능", "사용 중"]),
      cellEdited: (cell) => fn_HandleCellEdit(cell, "STATUS", setData, tableInstance),
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "생성일시",
      field: "CREATE_DATE",
      sorter: "string",
      width: 150,
    },
    {
      headerHozAlign: "center",
      hozAlign: "center",
      title: "수정일시",
      field: "UPDATE_DATE",
      sorter: "string",
      width: 150,
    },
  ];

  // 데이터 로드 함수
  const loadData = async () => {
    setLoading(true); // 로딩 시작
    setIsSearched(true); // 검색 플래그 설정
    try {
      const params = {
        p_FLOOR_ID: filters.FLOOR_ID || "",
        p_SECTION: filters.SECTION || "",
        p_DEBUG: "F",
      };
      const response = await fetchData(api, `${common.getServerUrl("reservation/layout/list")}`, params, { timeout: 30000 });
      if (!response.success) {
        errorMsgPopup(response.errMsg || "레이아웃 데이터를 가져오는 중 오류가 발생했습니다.");
        setData([]);
        return;
      }
      const responseData = Array.isArray(response.data)
        ? response.data.map((item) => ({
            ROOM_ID: item.ROOM_ID || `${item.FLOOR_ID}${item.SECTION}${item.ROOM_INDEX || 1}`,
            FLOOR_ID: item.FLOOR_ID || "",
            SECTION: item.SECTION || "",
            ROOM_TYPE: ["1인실", "2인실", "4인실", "8인실"].includes(item.ROOM_TYPE) ? item.ROOM_TYPE : "1인실",
            PRICE: item.PRICE || 0,
            CREATE_DATE: item.CREATE_DATE || new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
            UPDATE_DATE: item.UPDATE_DATE || new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
            STATUS: item.STATUS || "사용 가능",
            isDeleted: "N",
            isChanged: "N",
            isAdded: "N",
            col: Math.min(Math.max(item.col || 0, 0), 1), // col 값을 0~1로 제한
            row: Math.min(Math.max(item.row || 0, 0), 3), // row 값을 0~3으로 제한
            ...calculateSpan(["1인실", "2인실", "4인실", "8인실"].includes(item.ROOM_TYPE) ? item.ROOM_TYPE : "1인실"),
          }))
        : [];
      setData(responseData);
      const uniqueFloors = [...new Set(responseData.map((item) => item.FLOOR_ID))].filter(Boolean);
      setFloors(uniqueFloors);
      if (uniqueFloors.length > 0 && !selectedFloor) setSelectedFloor(uniqueFloors[0] || "");
      const initialLayout = uniqueFloors.reduce((acc, floor) => {
        acc[floor] = { A: [], B: [], C: [] };
        responseData
          .filter((item) => item.FLOOR_ID === floor && item.isDeleted !== "Y")
          .forEach((item) => {
            acc[floor][item.SECTION].push(item.ROOM_TYPE);
          });
        return acc;
      }, {});
      setSectionLayout(initialLayout);

      const initialGrid = uniqueFloors.reduce((acc, floor) => {
        acc[floor] = { A: [], B: [], C: [] };
        responseData
          .filter((item) => item.FLOOR_ID === floor && item.isDeleted !== "Y")
          .forEach((item) => {
            const validRoomType = item.ROOM_TYPE;
            const { colSpan, rowSpan } = calculateSpan(validRoomType);
            acc[floor][item.SECTION].push({
              roomType: validRoomType,
              col: item.col,
              row: item.row,
              colSpan: validRoomType === "8인실" ? 2 : colSpan, // 8인실 강제 2
              rowSpan: validRoomType === "8인실" ? 4 : rowSpan, // 8인실 강제 4
              size: roomSizeMap[validRoomType],
              orientation: colSpan > rowSpan ? "horizontal" : "vertical",
            });
          });
        return acc;
      }, {});
      setGridLayout(initialGrid);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      errorMsgPopup(`데이터 로드 실패: ${err.message || "서버 응답 없음"}`);
      setData([]);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  useEffect(() => {
    // 사용자 권한 확인 및 초기 데이터 로드
    if (!user || !hasPermission(user.auth, "menuManage")) navigate("/");
    else loadData();
  }, [user, navigate]);

  useEffect(() => {
    // 테이블 초기화
    const initializeTable = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!tableRef.current) {
        console.warn("테이블 컨테이너가 준비되지 않았습니다.");
        return;
      }
      try {
        tableInstance.current = createTable(tableRef.current, columns, [], {
          selectable: true, // 행 선택 가능하도록 설정
          selectableRangeMode: "click", // 클릭으로 선택 활성화
          rowFormatter: (row) => {
            const data = row.getData();
            const el = row.getElement();
            el.classList.remove("tabulator-selected", styles.addedRow, styles.editedRow);

            if (data.isDeleted === "Y") {
              row.select(); // 삭제된 행을 자동 선택
              el.style.backgroundColor = "#ffcccc"; // 연한 빨간색 하이라이트
            } else if (data.isAdded === "Y") {
              el.classList.add(styles.addedRow);
              el.style.backgroundColor = "#d4edda"; // 추가 시 하이라이트
            } else if (data.isChanged === "Y") {
              el.classList.add(styles.editedRow);
            }
          },
        });
        setTableStatus("ready");
      } catch (err) {
        setTableStatus("error");
        console.error("테이블 초기화 실패:", err.message);
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
    // 데이터 변경 시 테이블 갱신
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const table = tableInstance.current;
    if (!table || tableStatus !== "ready" || loading) return;
    table.setData(data);
    if (isSearched && data.length === 0 && !loading) table.alert("검색 결과 없음", "info");
    else {
      table.clearAlert();
      setRowCount(table.getDataCount());
    }
  }, [data, tableStatus, loading, isSearched]);

  useEffect(() => {
    // 필터 적용
    if (isInitialRender.current || !tableInstance.current || tableStatus !== "ready" || loading) return;
    const { filterSelect, filterText } = tableFilters;
    if (filterText && filterSelect) tableInstance.current.setFilter(filterSelect, "like", filterText);
    else if (filterText) {
      if (filterText !== "") {
        tableInstance.current.setFilter(
          [
            { field: "ROOM_ID", type: "like", value: filterText },
            { field: "FLOOR_ID", type: "like", value: filterText },
            { field: "SECTION", type: "like", value: filterText },
            { field: "ROOM_TYPE", type: "like", value: filterText },
            { field: "PRICE", type: "like", value: filterText },
            { field: "STATUS", type: "like", value: filterText },
          ],
          "or"
        );
      } else tableInstance.current.clearFilter();
    } else if (filterSelect) tableInstance.current.clearFilter();
  }, [tableFilters, tableStatus, loading]);

  useEffect(() => {
    // 드래그 중 그리드 업데이트
    if (dragState.isDragging && selectedFloor) {
      const { startCell, endCell, section } = dragState;
      if (startCell && endCell) {
        const colStart = Math.min(startCell.col, endCell.col);
        const colEnd = Math.max(startCell.col, endCell.col);
        const rowStart = Math.min(startCell.row, endCell.row);
        const rowEnd = Math.max(startCell.row, endCell.row);
        setGridLayout((prev) => ({
          ...prev,
          [selectedFloor]: {
            ...prev[selectedFloor],
            [section]:
              prev[selectedFloor]?.[section]?.map((item) =>
                item.col >= colStart && item.col <= colEnd && item.row >= rowStart && item.row <= rowEnd
                  ? { ...item, isDragging: true }
                  : item
              ) || [],
          },
        }));
      }
    }
  }, [dragState, selectedFloor]);

  const handleDynamicEvent = (eventType) => {
    // 동적 이벤트 처리
    if (eventType === "search") loadData();
  };

  const handleAddClick = () => setShowAddPopup(true); // 추가 버튼 클릭 처리

  const handleAddConfirm = () => {
    // 추가 확인 처리
    if (!newRowData.FLOOR_ID || !newRowData.SECTION || !newRowData.ROOM_TYPE) {
      errorMsgPopup("층 ID, 섹션, 호실 유형은 필수 입력 항목입니다.");
      return;
    }
    if (!newRowData.FLOOR_ID.match(/^[0-9]+F$/)) {
      errorMsgPopup("층 ID는 1F, 2F 등의 형식이어야 합니다.");
      return;
    }
    if (!["A", "B", "C"].includes(newRowData.SECTION)) {
      errorMsgPopup("섹션은 A, B, C 중 하나여야 합니다.");
      return;
    }
    if (newRowData.PRICE < 0) {
      errorMsgPopup("호실 가격은 0 이상이어야 합니다.");
      return;
    }

    const sectionData = data.filter(
      (row) =>
        row.FLOOR_ID === newRowData.FLOOR_ID && row.SECTION === newRowData.SECTION && row.isDeleted !== "Y" && row.STATUS !== "사용 중"
    );
    const totalSize = sectionData.reduce((sum, row) => sum + (roomSizeMap[row.ROOM_TYPE || "1인실"] || 0), 0);
    const newSize = roomSizeMap[newRowData.ROOM_TYPE] || 0;
    if (totalSize + newSize > 8) {
      errorMsgPopup(`${newRowData.SECTION} 섹션의 총 호실 크기가 8을 초과할 수 없습니다. 현재 합계: ${totalSize}`);
      return;
    }

    const existingIndexes = data
      .filter(
        (row) =>
          row.FLOOR_ID === newRowData.FLOOR_ID && row.SECTION === newRowData.SECTION && row.isDeleted !== "Y" && row.STATUS !== "사용 중"
      )
      .map((row) => parseInt(row.ROOM_ID.replace(`${row.FLOOR_ID}${row.SECTION}`, "")) || 0);
    const newRoomIndex = Math.max(0, ...existingIndexes) + 1;
    const newRoomId = `${newRowData.FLOOR_ID}${newRowData.SECTION}${newRoomIndex}`;

    const { colSpan, rowSpan } = calculateSpan(newRowData.ROOM_TYPE);
    const newRow = {
      ROOM_ID: newRoomId,
      FLOOR_ID: newRowData.FLOOR_ID,
      SECTION: newRowData.SECTION,
      ROOM_TYPE: newRowData.ROOM_TYPE,
      PRICE: newRowData.PRICE,
      CREATE_DATE: new Date().toISOString().slice(0, 19).replace("T", " "),
      UPDATE_DATE: new Date().toISOString().slice(0, 19).replace("T", " "),
      STATUS: "사용 가능",
      col: 0,
      row: 0,
      colSpan,
      rowSpan,
      isDeleted: "N",
      isChanged: "N",
      isAdded: "Y",
    };
    setData((prevData) => [newRow, ...prevData]);
    setSectionLayout((prev) => ({
      ...prev,
      [newRowData.FLOOR_ID]: {
        ...(prev[newRowData.FLOOR_ID] || { A: [], B: [], C: [] }),
        [newRowData.SECTION]: [...(prev[newRowData.FLOOR_ID]?.[newRowData.SECTION] || []), newRowData.ROOM_TYPE],
      },
    }));
    setGridLayout((prev) => ({
      ...prev,
      [newRowData.FLOOR_ID]: {
        ...(prev[newRowData.FLOOR_ID] || { A: [], B: [], C: [] }),
        [newRowData.SECTION]: [
          ...(prev[newRowData.FLOOR_ID]?.[newRowData.SECTION] || []),
          {
            roomType: newRowData.ROOM_TYPE,
            col: 0,
            row: 0,
            colSpan,
            rowSpan,
            size: roomSizeMap[newRowData.ROOM_TYPE],
            orientation: colSpan > rowSpan ? "horizontal" : "vertical",
          },
        ],
      },
    }));
    setImsiCounter((prev) => prev + 1);
    setShowAddPopup(false);
    setNewRowData({
      FLOOR_ID: "",
      SECTION: "",
      ROOM_TYPE: "1인실",
      PRICE: 0,
      ROOM_INDEX: 1,
    });
  };

  const handleAddCancel = () => {
    // 추가 취소 처리
    setShowAddPopup(false);
    setNewRowData({
      FLOOR_ID: "",
      SECTION: "",
      ROOM_TYPE: "1인실",
      PRICE: 0,
      ROOM_INDEX: 1,
    });
  };

  const handleDelete = (rowData) => {
    // 호실 삭제 처리
    if (!rowData || !rowData.ROOM_ID) {
      errorMsgPopup("삭제할 데이터가 없습니다.");
      return;
    }
    if (rowData.STATUS === "사용 중") {
      errorMsgPopup("사용 중인 호실은 삭제할 수 없습니다.");
      return;
    }
    const table = tableInstance.current;
    if (table) {
      const row = table.getRows().find((r) => r.getData().ROOM_ID === rowData.ROOM_ID);
      if (row) {
        row.select(); // 삭제 버튼 클릭 시 해당 행 선택
      }
    }
    setData((prevData) =>
      prevData.map((row) =>
        row.ROOM_ID === rowData.ROOM_ID ? { ...row, isDeleted: "Y", isChanged: row.isAdded === "Y" ? "N" : "Y" } : row
      )
    );
    setSectionLayout((prev) => ({
      ...prev,
      [rowData.FLOOR_ID]: {
        ...prev[rowData.FLOOR_ID],
        [rowData.SECTION]:
          prev[rowData.FLOOR_ID]?.[rowData.SECTION]?.filter(
            (_, i) => i !== prev[rowData.FLOOR_ID]?.[rowData.SECTION]?.indexOf(rowData.ROOM_TYPE || "1인실")
          ) || [],
      },
    }));
    setGridLayout((prev) => ({
      ...prev,
      [rowData.FLOOR_ID]: {
        ...prev[rowData.FLOOR_ID],
        [rowData.SECTION]:
          prev[rowData.FLOOR_ID]?.[rowData.SECTION]?.filter((item) => !(item.col === rowData.col && item.row === rowData.row)) || [],
      },
    }));
  };

  const handleAddFloor = () => {
    // 새 층 추가 처리
    if (!newFloorInput) {
      errorMsgPopup("층 ID를 입력해주세요.");
      return;
    }
    if (!newFloorInput.match(/^[0-9]+F$/)) {
      errorMsgPopup("층 ID는 1F, 2F 등의 형식이어야 합니다.");
      return;
    }
    if (floors.includes(newFloorInput)) {
      errorMsgPopup("이미 존재하는 층 ID입니다.");
      return;
    }

    setFloors([...floors, newFloorInput]);
    setSelectedFloor(newFloorInput);
    setSectionLayout((prev) => ({
      ...prev,
      [newFloorInput]: { A: [], B: [], C: [] },
    }));
    setGridLayout((prev) => ({
      ...prev,
      [newFloorInput]: { A: [], B: [], C: [] },
    }));
    setNewFloorInput("");
    msgPopup(`새로운 층 ${newFloorInput}가 추가되었습니다.`);
  };

  const handleDeleteFloor = () => {
    if (!newFloorInput) {
      errorMsgPopup("삭제할 층 ID를 입력해주세요.");
      return;
    }
    if (!newFloorInput.match(/^[0-9]+F$/)) {
      errorMsgPopup("층 ID는 1F, 2F 등의 형식이어야 합니다.");
      return;
    }
    if (!floors.includes(newFloorInput)) {
      errorMsgPopup("입력한 층 ID가 존재하지 않습니다.");
      return;
    }
    const isInUse = data.some((item) => item.FLOOR_ID === newFloorInput && item.STATUS === "사용 중");
    if (isInUse) {
      errorMsgPopup("사용 중인 층은 삭제할 수 없습니다.");
      return;
    }

    setData((prevData) =>
      prevData.map((row) =>
        row.FLOOR_ID === selectedFloor && row.isDeleted !== "Y" && row.STATUS !== "사용 중"
          ? { ...row, isDeleted: "Y", isChanged: row.isAdded === "Y" ? "N" : "Y" }
          : row
      )
    );

    setSectionLayout((prev) => {
      const newLayout = { ...prev };
      delete newLayout[selectedFloor];
      return newLayout;
    });
    setGridLayout((prev) => {
      const newLayout = { ...prev };
      delete newLayout[selectedFloor];
      return newLayout;
    });

    setFloors((prev) => prev.filter((floor) => floor !== selectedFloor));
    setSelectedFloor(floors.find((floor) => floor !== selectedFloor) || "");
    // msgPopup(`층 ${selectedFloor}가 삭제되었습니다.`);
  };

  const handleMouseDown = (section, col, row) => {
    // 마우스 다운 이벤트 처리
    if (!selectedFloor) {
      errorMsgPopup("층을 먼저 선택하세요.");
      return;
    }
    const isOccupied = data.some(
      (item) =>
        item.FLOOR_ID === selectedFloor && item.SECTION === section && item.col === col && item.row === row && item.STATUS === "사용 중"
    );
    if (isOccupied) {
      errorMsgPopup("사용 중인 호실은 수정할 수 없습니다.");
      return;
    }
    setDragState({
      isDragging: true,
      startCell: { col, row },
      endCell: { col, row },
      section,
    });
  };

  const handleMouseOver = (col, row) => {
    // 마우스 오버 이벤트 처리
    if (dragState.isDragging && selectedFloor) {
      setDragState((prev) => ({
        ...prev,
        endCell: { col: Math.min(Math.max(col, 0), 1), row: Math.min(Math.max(row, 0), 3) },
      }));
    }
  };

  const handleMouseUp = () => {
    if (!dragState.isDragging || !selectedFloor) return;
    const { startCell, endCell, section } = dragState;

    const colStart = Math.min(startCell.col, endCell.col);
    const colEnd = Math.max(startCell.col, endCell.col);
    const rowStart = Math.min(startCell.row, endCell.row);
    const rowEnd = Math.max(startCell.row, endCell.row);
    let colSpan = colEnd - colStart + 1;
    let rowSpan = rowEnd - rowStart + 1;
    const size = colSpan * rowSpan;

    // 크기 및 방향 검증: 1, 2, 4, 8만 허용, 2인실과 4인실의 유효한 패턴 적용
    if (![1, 2, 4, 8].includes(size)) {
      errorMsgPopup("선택한 셀 크기는 1, 2, 4, 8 중 하나여야 합니다.");
      setDragState({ isDragging: false, startCell: null, endCell: null, section: null });
      return;
    }

    let roomType, adjustedColSpan, adjustedRowSpan;
    if (size === 1) {
      roomType = "1인실";
      adjustedColSpan = 1;
      adjustedRowSpan = 1;
    } else if (size === 2) {
      roomType = "2인실";
      if (colSpan === 1 && rowSpan === 2) {
        adjustedColSpan = 1;
        adjustedRowSpan = 2; // 1x2 (세로)
      } else if (colSpan === 2 && rowSpan === 1) {
        adjustedColSpan = 2;
        adjustedRowSpan = 1; // 2x1 (가로)
      } else {
        errorMsgPopup("2인실은 1x2 또는 2x1 형식이어야 합니다.");
        setDragState({ isDragging: false, startCell: null, endCell: null, section: null });
        return;
      }
    } else if (size === 4) {
      roomType = "4인실";
      if (colSpan === 1 && rowSpan === 4) {
        adjustedColSpan = 1;
        adjustedRowSpan = 4; // 1x4 (세로)
      } else if (colSpan === 2 && rowSpan === 2) {
        adjustedColSpan = 2;
        adjustedRowSpan = 2; // 2x2 (가로)
      } else {
        errorMsgPopup("4인실은 1x4 또는 2x2 형식이어야 합니다.");
        setDragState({ isDragging: false, startCell: null, endCell: null, section: null });
        return;
      }
    } else if (size === 8) {
      roomType = "8인실";
      adjustedColSpan = 2;
      adjustedRowSpan = 4; // 2x4로 고정
    }

    const currentSize = sectionLayout[selectedFloor]?.[section]?.reduce((sum, r) => sum + (roomSizeMap[r || "1인실"] || 0), 0) || 0;
    if (currentSize + size > 8) {
      errorMsgPopup(`${section} 섹션의 총 크기가 8을 초과할 수 없습니다. (현재: ${currentSize})`);
      setDragState({ isDragging: false, startCell: null, endCell: null, section: null });
      return;
    }

    const isOverlapping = gridLayout[selectedFloor]?.[section]?.some((item) => {
      const itemColEnd = item.col + (item.colSpan || 1) - 1;
      const itemRowEnd = item.row + (item.rowSpan || 1) - 1;
      return !(colEnd < item.col || colStart > itemColEnd || rowEnd < item.row || rowStart > itemRowEnd);
    });
    if (isOverlapping) {
      errorMsgPopup("이미 다른 호실이 배치된 위치입니다.");
      setDragState({ isDragging: false, startCell: null, endCell: null, section: null });
      return;
    }

    const existingIndexes = data
      .filter((row) => row.FLOOR_ID === selectedFloor && row.SECTION === section && row.isDeleted !== "Y" && row.STATUS !== "사용 중")
      .map((row) => parseInt(row.ROOM_ID.replace(`${selectedFloor}${section}`, "")) || 0);
    const newRoomIndex = Math.max(0, ...existingIndexes) + 1;
    const newRoomId = `${selectedFloor}${section}${newRoomIndex}`;

    const newRow = {
      ROOM_ID: newRoomId,
      FLOOR_ID: selectedFloor,
      SECTION: section,
      ROOM_TYPE: roomType,
      PRICE: 0,
      CREATE_DATE: new Date().toISOString().slice(0, 19).replace("T", " "),
      UPDATE_DATE: new Date().toISOString().slice(0, 19).replace("T", " "),
      STATUS: "사용 가능",
      col: colStart,
      row: rowStart,
      colSpan: adjustedColSpan,
      rowSpan: adjustedRowSpan,
      isDeleted: "N",
      isChanged: "N",
      isAdded: "Y",
    };

    setData((prevData) => [newRow, ...prevData]);
    setSectionLayout((prev) => ({
      ...prev,
      [selectedFloor]: {
        ...prev[selectedFloor],
        [section]: [...(prev[selectedFloor]?.[section] || []), roomType],
      },
    }));
    setGridLayout((prev) => ({
      ...prev,
      [selectedFloor]: {
        ...prev[selectedFloor],
        [section]: [
          ...(prev[selectedFloor]?.[section] || []),
          {
            roomType,
            col: colStart,
            row: rowStart,
            colSpan: adjustedColSpan,
            rowSpan: adjustedRowSpan,
            size,
            orientation: adjustedColSpan > adjustedRowSpan ? "horizontal" : "vertical",
          },
        ],
      },
    }));
    setDragState({ isDragging: false, startCell: null, endCell: null, section: null });
  };

  const removeRoom = (section, index) => {
    // 호실 제거 처리
    if (!selectedFloor) {
      errorMsgPopup("층을 먼저 선택하세요.");
      return;
    }
    const room = gridLayout[selectedFloor]?.[section]?.[index];
    if (!room) return;
    const roomId = data.find(
      (row) =>
        row.FLOOR_ID === selectedFloor &&
        row.SECTION === section &&
        row.ROOM_TYPE === (room.roomType || "1인실") &&
        row.col === room.col &&
        row.row === room.row
    )?.ROOM_ID;
    if (!roomId) return;
    if (
      data.find((row) => row.ROOM_ID === roomId && row.FLOOR_ID === selectedFloor && row.SECTION === section && row.STATUS === "사용 중")
    ) {
      errorMsgPopup("사용 중인 호실은 삭제할 수 없습니다.");
      return;
    }
    setData((prevData) =>
      prevData
        .map((row) =>
          row.ROOM_ID === roomId && row.isAdded === "Y" ? null : row.ROOM_ID === roomId ? { ...row, isDeleted: "Y", isChanged: "Y" } : row
        )
        .filter(Boolean)
    );
    setSectionLayout((prev) => ({
      ...prev,
      [selectedFloor]: {
        ...prev[selectedFloor],
        [section]: prev[selectedFloor]?.[section]?.filter((_, i) => i !== index) || [],
      },
    }));
    setGridLayout((prev) => ({
      ...prev,
      [selectedFloor]: {
        ...prev[selectedFloor],
        [section]: prev[selectedFloor]?.[section]?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const handleSaveLayout = async (e) => {
    e.preventDefault();
    const changedRows = data.filter(
      (row) => (row.isDeleted === "Y" && row.isAdded !== "Y") || row.isAdded === "Y" || (row.isChanged === "Y" && row.isDeleted === "N")
    );

    if (changedRows.length === 0) {
      errorMsgPopup("변경된 데이터가 없습니다.");
      return;
    }

    const sections = ["A", "B", "C"];
    const floorIds = [...new Set(changedRows.map((row) => row.FLOOR_ID))];
    for (const floorId of floorIds) {
      for (const section of sections) {
        const sectionData = changedRows.filter((row) => row.FLOOR_ID === floorId && row.SECTION === section && row.isDeleted !== "Y");
        const totalSize = sectionData.reduce((sum, row) => sum + (roomSizeMap[row.ROOM_TYPE || "1인실"] || 0), 0);
        if (sectionData.length > 0 && totalSize > 8) {
          errorMsgPopup(`${floorId} ${section} 섹션의 총 호실 크기가 8을 초과합니다. (현재: ${totalSize})`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const saveRequests = changedRows.map((row) => {
        let p_GUBUN = "";
        if (row.isDeleted === "Y" && row.isAdded !== "Y") {
          if (filters.FLOOR_ID && row.FLOOR_ID !== filters.FLOOR_ID) return Promise.resolve();
          if (filters.SECTION && row.SECTION !== filters.SECTION) return Promise.resolve();
          p_GUBUN = "D";
        } else if (row.isAdded === "Y") p_GUBUN = "I";
        else if (row.isChanged === "Y" && row.isDeleted === "N") p_GUBUN = "U";

        const params = {
          p_GUBUN,
          p_ROOM_ID: row.ROOM_ID,
          p_FLOOR_ID: row.FLOOR_ID,
          p_SECTION: row.SECTION,
          p_ROOM_INDEX: parseInt(row.ROOM_ID.replace(`${row.FLOOR_ID}${row.SECTION}`, "")) || 1,
          p_ROOM_TYPE: row.ROOM_TYPE || "1인실",
          p_PRICE: row.PRICE || 0,
          p_EMP_NO: user?.empNo || "admin",
          p_DEBUG: "F",
        };

        return fetchData(api, `${common.getServerUrl("reservation/layout/save")}`, params, { timeout: 60000 });
      });

      const responses = await Promise.all(saveRequests);

      const failedResponses = responses.filter((response) => !response.success);
      if (failedResponses.length > 0) {
        failedResponses.forEach((response, index) => {
          const row = changedRows[index];
          errorMsgPopup(
            `${response.p_GUBUN === "D" ? "삭제" : response.p_GUBUN === "I" ? "추가" : "수정"} 실패: ${
              response.errMsg || "서버 오류"
            } (ROOM_ID: ${row.ROOM_ID})`
          );
        });
      } else {
        msgPopup("모든 변경사항이 성공적으로 저장되었습니다.");
      }

      await loadData();
      setGridLayout((prev) => ({ ...prev }));
    } catch (err) {
      console.error("저장 오류:", err);
      errorMsgPopup("레이아웃 저장 중 오류가 발생했습니다: " + (err.message || "서버 응답 없음"));
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
        onDownloadExcel={() => handleDownloadExcel(tableInstance.current, tableStatus, "레이아웃관리.xlsx")}
        buttonStyles={styles}
      >
        <div className={styles.btnGroupCustom}>
          <button className={`${styles.btn} text-bg-primary`} onClick={handleAddClick}>
            추가
          </button>
          <button className={`${styles.btn} text-bg-success`} onClick={handleSaveLayout}>
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
      <div className="mt-6 max-w-6xl mx-auto">
        <div className="w-full p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "2px solid #e9ecef",
                fontSize: "1rem",
                background: "white",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>
                층을 선택하세요
              </option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={newFloorInput}
                onChange={(e) => setNewFloorInput(e.target.value)}
                placeholder="층 입력 (예: 3F)"
                style={{
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "2px solid #e9ecef",
                  fontSize: "1rem",
                }}
              />
              <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleAddFloor}>
                층 추가
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDeleteFloor}
                disabled={!selectedFloor}
              >
                층 삭제
              </button>
            </div>
          </div>
          {selectedFloor && (
            <div style={{ position: "relative", width: "100%", height: "400px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", position: "absolute", top: "-2rem", left: 0, right: 0 }}>
                <span style={{ fontSize: "1.125rem", fontWeight: "600", color: "#374151", textAlign: "center", flex: "1" }}>A 섹션</span>
                <span style={{ fontSize: "1.125rem", fontWeight: "600", color: "#374151", textAlign: "center", flex: "1" }}>B 섹션</span>
                <span style={{ fontSize: "1.125rem", fontWeight: "600", color: "#374151", textAlign: "center", flex: "1" }}>C 섹션</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  width: "100%",
                  minWidth: "100%",
                  height: "300px",
                  overflowX: "auto",
                  marginTop: "1.5rem",
                  boxSizing: "border-box", // 테두리와 패딩 포함
                }}
              >
                {["A", "B", "C"].map((section) => (
                  <div
                    key={section}
                    data-section={section}
                    style={{
                      flex: "1 1 33.3%",
                      padding: "8px",
                      border: "2px solid #d1d5db",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gridTemplateRows: "repeat(4, 1fr)",
                      gap: "4px",
                      minHeight: "300px",
                      position: "relative",
                      margin: "0 4px",
                      minWidth: "300px",
                      boxSizing: "border-box", // 테두리와 패딩 포함
                    }}
                    onMouseUp={handleMouseUp}
                  >
                    {Array.from({ length: 8 }).map((_, index) => {
                      const col = index % 2;
                      const row = Math.floor(index / 2);
                      const isSelected =
                        dragState.isDragging &&
                        dragState.section === section &&
                        col >= Math.min(dragState.startCell?.col, dragState.endCell?.col) &&
                        col <= Math.max(dragState.startCell?.col, dragState.endCell?.col) &&
                        row >= Math.min(dragState.startCell?.row, dragState.endCell?.row) &&
                        row <= Math.max(dragState.startCell?.row, dragState.endCell?.row);
                      const room = gridLayout[selectedFloor]?.[section]?.find((item) => item.col === col && item.row === row);
                      const isUsed = data.some(
                        (item) =>
                          item.FLOOR_ID === selectedFloor &&
                          item.SECTION === section &&
                          item.col === col &&
                          item.row === row &&
                          item.STATUS === "사용 중"
                      );
                      const isOccupied = gridLayout[selectedFloor]?.[section]?.some((item) => {
                        const itemColEnd = item.col + (item.colSpan || 1) - 1;
                        const itemRowEnd = item.row + (item.rowSpan || 1) - 1;
                        return (
                          col >= item.col &&
                          col <= itemColEnd &&
                          row >= item.row &&
                          row <= itemRowEnd &&
                          (item.col !== col || item.row !== row)
                        );
                      });

                      if (room) {
                        return (
                          <div
                            key={`cell-${section}-${col}-${row}`}
                            style={{
                              gridColumn: `${room.col + 1} / span ${room.colSpan}`,
                              gridRow: `${room.row + 1} / span ${room.rowSpan}`,
                              padding: "4px",
                              textAlign: "center",
                              borderRadius: "4px",
                              color: "#fff",
                              background: isUsed ? "#888888" : getRoomColor(room.roomType || "1인실"),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: isUsed ? "not-allowed" : "pointer",
                              opacity: isUsed ? 0.6 : 1,
                            }}
                          >
                            {room.roomType || "1인실"}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`cell-${section}-${col}-${row}`}
                          style={{
                            gridColumn: `${col + 1} / span 1`,
                            gridRow: `${row + 1} / span 1`,
                            padding: "4px",
                            textAlign: "center",
                            borderRadius: "4px",
                            color: "#fff",
                            background: isUsed ? "#888888" : isSelected ? "#90cdf4" : isOccupied ? "#e5e7eb" : "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: isUsed || isOccupied ? "not-allowed" : "pointer",
                            opacity: isUsed || isOccupied ? 0.6 : 1,
                          }}
                          onMouseDown={() => !isUsed && !isOccupied && handleMouseDown(section, col, row)}
                          onMouseOver={() => !isUsed && !isOccupied && handleMouseOver(col, row)}
                        >
                          {isUsed ? "사용 중" : isOccupied ? "" : "빈 공간"}
                        </div>
                      );
                    })}
                    <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>
                      총 크기: {sectionLayout[selectedFloor]?.[section]?.reduce((sum, r) => sum + (roomSizeMap[r || "1인실"] || 0), 0) || 0}{" "}
                      / 8
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <CommonPopup show={showAddPopup} onHide={handleAddCancel} onConfirm={handleAddConfirm} title="레이아웃 추가">
        <div className="mb-3">
          <label className="form-label">층 ID</label>
          <input
            type="text"
            className={`form-control ${styles.formControl}`}
            placeholder="층 ID 입력 (예: 1F)"
            value={newRowData.FLOOR_ID}
            onChange={(e) => setNewRowData({ ...newRowData, FLOOR_ID: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">섹션</label>
          <select
            className={`form-select ${styles.formSelect}`}
            value={newRowData.SECTION}
            onChange={(e) => setNewRowData({ ...newRowData, SECTION: e.target.value })}
          >
            <option value="">섹션 선택</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">호실 유형</label>
          <select
            className={`form-select ${styles.formSelect}`}
            value={newRowData.ROOM_TYPE}
            onChange={(e) => setNewRowData({ ...newRowData, ROOM_TYPE: e.target.value })}
          >
            <option value="1인실">1인실</option>
            <option value="2인실">2인실</option>
            <option value="4인실">4인실</option>
            <option value="8인실">8인실</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">호실 가격</label>
          <input
            type="number"
            className={`form-control ${styles.formControl}`}
            placeholder="호실 가격 입력"
            min="0"
            value={newRowData.PRICE}
            onChange={(e) => setNewRowData({ ...newRowData, PRICE: parseInt(e.target.value) || 0 })}
          />
        </div>
      </CommonPopup>
    </div>
  );
};

// 호실 유형에 따른 색상 반환
const getRoomColor = (roomType) => {
  // 호실 유형별 색상 반환
  switch (roomType) {
    case "1인실":
      return "#3498db";
    case "2인실":
      return "#e74c3c";
    case "4인실":
      return "#2ecc71";
    case "8인실":
      return "#FF6B35";
    default:
      return "#e5e7eb";
  }
};

export default ReservationAdminPage;
