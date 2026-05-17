import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Navigation, Loader2, MapPin as MapPinIcon } from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ⭐ FIX LEAFLET ICON BUG
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ⭐ CUSTOM MARKER COMPONENT
function LocationMarker({ position, setPosition, onLocationChange }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationChange(lat, lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();

          setPosition([lat, lng]);
          onLocationChange(lat, lng);
        },
      }}
    />
  ) : null;
}

// ⭐ COMPONENT ĐỂ FLY TO LOCATION KHI VỊ TRÍ THAY ĐỔI
function FlyToLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position]);

  return null;
}

// ⭐ MAIN MAP PICKER COMPONENT
const MapPicker = ({
  lat,
  lng,
  address,
  onCoordinatesChange,
  onAddressChange,
}) => {
  const [position, setPosition] = useState([lat, lng]);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState(address || "");

  // Sync position when props change (Edit mode)
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  // Sync address when props change
  useEffect(() => {
    if (address) {
      setSearchAddress(address);
    }
  }, [address]);

  // ⭐ REVERSE GEOCODING - Từ tọa độ → địa chỉ
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat,
            lon: lng,
            format: "json",
            addressdetails: 1,
            "accept-language": "vi",
          },
          headers: {
            "User-Agent": "D-Pulse-Travel-Platform",
          },
        },
      );

      if (response.data?.display_name) {
        const fullAddress = response.data.display_name;

        setSearchAddress(fullAddress);
        onAddressChange(fullAddress);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  // ⭐ FORWARD GEOCODING - Từ địa chỉ → tọa độ
  const forwardGeocode = async (addressQuery) => {
    if (!addressQuery || addressQuery.length < 3) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: addressQuery.toLowerCase().includes("đà nẵng") ? addressQuery : `${addressQuery}, Đà Nẵng`,
            format: "json",
            limit: 1,
            countrycodes: "vn", // Giới hạn trong VN
            viewbox: "107.8180,16.2150,108.3500,15.9100", 
            bounded: 1,
            "accept-language": "vi",
          },
          headers: {
            "User-Agent": "D-Pulse-Travel-Platform",
          },
        },
      );

      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        setPosition([newLat, newLng]);
        onCoordinatesChange(newLat, newLng);
        setSearchAddress(display_name);
        onAddressChange(display_name);
      } else {
        alert("Không tìm thấy địa chỉ này tại Đà Nẵng. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Forward geocoding error:", error);
      alert("Lỗi khi tìm kiếm địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ GET CURRENT LOCATION
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ Geolocation");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        onCoordinatesChange(latitude, longitude);

        // Reverse geocode to get address
        await reverseGeocode(latitude, longitude);

        setLoading(false);
        alert("✅ Đã lấy vị trí hiện tại");
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("❌ Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí.");
        setLoading(false);
      },
    );
  };

  // ⭐ HANDLE MAP CLICK
  const handleLocationChange = async (newLat, newLng) => {
    onCoordinatesChange(newLat, newLng);
    await reverseGeocode(newLat, newLng);
  };

  return (
    <div className="space-y-4">
      {/* ADDRESS SEARCH INPUT */}
      <div>
        <label className="block text-sm font-bold text-[#004D40] mb-1.5">
          Địa chỉ cụ thể <span className="text-[#FFAB40]">*</span>
        </label>
        <div className="relative">
          <MapPinIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#004D40]/40"
            size={20}
          />
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => {
              setSearchAddress(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                forwardGeocode(searchAddress);
              }
            }}
            placeholder="VD: 123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng"
            className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-[#E0F2F1] rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md focus:ring-2 focus:ring-[#004D40]/20 outline-none text-sm font-bold text-[#004D40] placeholder-[#004D40]/40 transition-all"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5 ml-1">
          💡 Nhập địa chỉ và nhấn Enter để tìm kiếm trên bản đồ
        </p>
      </div>

      {/* GET CURRENT LOCATION BUTTON */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-600 font-medium">
          Click vào bản đồ để đặt ghim vị trí
        </p>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="text-sm text-[#FFAB40] flex items-center gap-1 hover:text-[#e09635] font-bold transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Đang lấy...
            </>
          ) : (
            <>
              <Navigation size={16} /> Lấy vị trí hiện tại
            </>
          )}
        </button>
      </div>

      {/* MAP CONTAINER */}
      <div className="w-full h-[400px] rounded-tr-[24px] rounded-bl-[24px] rounded-tl-xl rounded-br-xl overflow-hidden border-2 border-[#004D40]/20 shadow-lg">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToLocation position={position} />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationChange={handleLocationChange}
          />
        </MapContainer>
      </div>

      {/* COORDINATES DISPLAY */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">
            Kinh độ (Longitude)
          </label>
          <input
            type="text"
            value={position?.[1]?.toFixed(6) || ""}
            readOnly
            className="w-full px-3 py-2 bg-black/5 border border-[#E0F2F1] rounded-tr-[20px] rounded-bl-[20px] rounded-tl-md rounded-br-md text-sm text-[#004D40] font-medium outline-none cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#004D40]/70 mb-1.5">
            Vĩ độ (Latitude)
          </label>
          <input
            type="text"
            value={position[0].toFixed(6)}
            readOnly
            className="w-full px-3 py-2 bg-black/5 border border-[#E0F2F1] rounded-tr-[20px] rounded-bl-[20px] rounded-tl-md rounded-br-md text-sm text-[#004D40] font-medium outline-none cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

export default MapPicker;