import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const MapComponent = () => {
  const mapRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const fixedLatitude = 37.291614; // 연세IT미래교육원 장안문 캠퍼스
  const fixedLongitude = 127.012637;

  const getApiUrl = () => {
    return "https://port-0-java-springboot-mbebujvsfb073e29.sel4.cloudtype.app"; // 고정 URL 사용
  };

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const apiUrl = getApiUrl();
        console.log("Fetching from:", `${apiUrl}/api/naver/client-id`);
        const response = await axios.get(`${apiUrl}/api/naver/client-id`, {
          headers: { "Content-Type": "application/json" }, // withCredentials 제거
        });
        console.log("Response:", response.data);
        setClientId(response.data.clientId);
      } catch (error) {
        console.error("클라이언트 ID 가져오기 실패:", error);
      }
    };
    fetchClientId();
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
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