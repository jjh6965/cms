import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const MapComponent = () => {
  const mapRef = useRef(null);
  const [clientId, setClientId] = useState("");
  const fixedLatitude = 37.291614; // 연세IT미래교육원 장안문 캠퍼스
  const fixedLongitude = 127.012637;

  const getApiUrl = () => {
    return "https://port-0-java-springboot-mbebujvsfb073e29.sel4.cloudtype.app";
  };

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const apiUrl = getApiUrl();
        console.log("Fetching clientId from:", `${apiUrl}/api/naver/client-id`);
        const response = await axios.get(`${apiUrl}/api/naver/client-id`, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("Received response:", response.data);
        if (response.data && response.data.clientId) {
          setClientId(response.data.clientId);
        } else {
          console.error("No clientId in response:", response.data);
        }
      } catch (error) {
        console.error("Failed to fetch clientId:", error.message);
        if (error.response) {
          console.error("Server response:", error.response.data);
        }
      }
    };
    fetchClientId();
  }, []);

  useEffect(() => {
    if (!clientId || clientId.trim() === "") {
      console.warn("Client ID is missing or invalid, map will not load.");
      return;
    }

    window.navermap_authFailure = function () {
      console.error("Naver Maps API authentication failed. Check clientId and URL.");
    };

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&callback=initMap`;
    script.async = true;
    script.onload = () => {
      console.log("Map script loaded successfully. Checking naver.maps...");
      if (!window.naver || !window.naver.maps) {
        console.error("Naver Maps API not available after load.");
      }
    };
    script.onerror = () => {
      console.error("Failed to load Naver Maps API script. Check network or clientId.");
    };
    document.head.appendChild(script);

    window.initMap = () => {
      console.log("Initializing map with clientId:", clientId);
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
        console.log("Map initialized successfully.");
      } else {
        console.error("Naver Maps API failed to initialize. Ensure clientId is valid.");
      }
    };

    return () => {
      document.head.removeChild(script);
      delete window.navermap_authFailure;
      delete window.initMap;
    };
  }, [clientId]);

  return <div ref={mapRef} style={{ width: "100%", height: "500px" }} />;
};

export default MapComponent;