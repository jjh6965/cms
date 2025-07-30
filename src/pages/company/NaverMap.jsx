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
    const url = window.location.hostname === "localhost" ? "http://localhost:8080" : "https://jh9695-backend.cloudtype.app";
    console.log("Using API URL:", url);
    return url;
  };

  // 백엔드에서 클라이언트 ID 가져오기
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const apiUrl = getApiUrl();
        console.log("Fetching from:", `${apiUrl}/api/naver/client-id`);
        const response = await axios.get(`${apiUrl}/api/naver/client-id`);
        console.log("Response:", response.data);
        setClientId(response.data.clientId);
      } catch (error) {
        console.error("클라이언트 ID 가져오기 실패:", error);
      }
    };
    fetchClientId();
  }, []);

  // 네이버 지도 API 스크립트 동적 로드 및 지도 초기화
  useEffect(() => {
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(fixedLatitude, fixedLongitude),
          zoom: 13,
          mapTypeControl: true, // 맵 타입 컨트롤 활성화
          mapTypeId: window.naver.maps.MapTypeId.SATELLITE, // 위성 맵 기본 설정
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