import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const MapComponent = () => {
  const mapRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  // 하드코딩된 좌표
  // 연세IT미래교육원 장안문 캠퍼스
  const fixedLatitude = 37.291614;
  const fixedLongitude = 127.012637;

  // API URL 동적 설정
  const getApiUrl = () => {
    return (
      import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:8080"
        : "https://port-0-java-springboot-mbebujvsfb073e29.sel4.cloudtype.app")
    );
  };

  // 백엔드에서 클라이언트 ID 가져오기
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const apiUrl = getApiUrl();
        console.log("Fetching from:", `${apiUrl}/api/naver/client-id`);
        // withCredentials 제거, 토큰 임시 비활성화 (서버가 인증 없이 허용하도록 설정됨)
        const response = await axios.get(`${apiUrl}/api/naver/client-id`);
        console.log("Response data:", response.data);
        setClientId(response.data.clientId);
      } catch (error) {
        console.error("클라이언트 ID 가져오기 실패:", error.response ? error.response.status : error.message);
      }
    };
    fetchClientId();
  }, []);

  // 네이버 지도 API 스크립트 동적 로드 및 지도 초기화
  useEffect(() => {
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`; // ncpKeyId -> ncpClientId로 수정
    script.async = true;
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(fixedLatitude, fixedLongitude),
          zoom: 13,
          mapTypeControl: true,
          mapTypeId: window.naver.maps.MapTypeId.SATELLITE,
          draggable: true,
          pinchZoom: true,
          scrollWheel: true,
        });

        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(fixedLatitude, fixedLongitude),
          map: map,
          draggable: false,
        });
      }
    };
    script.onerror = () => console.error("네이버 지도 API 로드 실패");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [clientId]);

  return <div ref={mapRef} style={{ width: "100%", height: "500px" }} />;
};

export default MapComponent;