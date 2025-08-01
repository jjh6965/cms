import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const MapComponent = () => {
  const mapRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fixedLatitude = 37.291614;
  const fixedLongitude = 127.012637;

  const getApiUrl = () => {
    return (
      import.meta.env.VITE_API_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:8080"
        : "https://port-0-java-springboot-mbebujvsfb073e29.sel4.cloudtype.app")
    );
  };

  useEffect(() => {
    const fetchClientId = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        console.log("Fetching from:", `${apiUrl}/api/naver/client-id`);
        const token = localStorage.getItem("token"); // JWT 토큰 가져오기
        const response = await axios.get(`${apiUrl}/api/naver/client-id`, {
          withCredentials: true,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined, // 토큰이 있으면 추가
          },
        });
        console.log("Response data:", response.data);
        setClientId(response.data.clientId);
      } catch (error) {
        console.error(
          "클라이언트 ID 가져오기 실패:",
          error.response ? error.response.status : error.message,
          error.response ? error.response.data : {}
        );
        if (error.response && error.response.status === 401) {
          console.warn("401 발생, 서버 인증 문제 확인 필요");
          setError("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
          // 임시 clientId 제거, 대신 오류 표시
        } else {
          setError("클라이언트 ID를 가져오지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClientId();
  }, []);

  useEffect(() => {
    if (loading || !clientId) return;

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&callback=initMap`;
    script.async = true;
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        window.initMap = () => {
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
        };
        window.initMap();
      } else {
        console.error("네이버 지도 API 로드 실패 - window.naver 또는 naver.maps가 정의되지 않음");
      }
    };
    script.onerror = () => console.error("네이버 지도 API 로드 실패");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete window.initMap;
    };
  }, [clientId, loading]);

  window.navermap_authFailure = function () {
    console.error("네이버 지도 API 인증 실패");
    setLoading(false);
    setError("네이버 지도 API 인증 실패");
  };

  return (
    <div>
      {loading ? (
        <p>로드 중...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div ref={mapRef} style={{ width: "100%", height: "500px" }} />
      )}
    </div>
  );
};

export default MapComponent;