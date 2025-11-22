import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import geocode from '../services/geocode';

// 修复 react-leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const GeospatialView = ({ data }) => {
  const [markers, setMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState([34.5, 108.9]); // 默认中国中心

  useEffect(() => {
    if (!data || data.length === 0) {
      setMarkers([]);
      return;
    }

    const newMarkers = data
      .map((item, index) => {
        const locationName = item['Unnamed: 5'] || item.llm_processed?.location || item['地点'] || item['城市'];
        if (!locationName || typeof locationName !== 'string') return null;

        const coordinates = geocode(locationName);
        if (!coordinates) return null;

        const eventName = item['三级'] || item.llm_processed?.event_name || '未知事件';

        return (
          <Marker position={coordinates} key={`${item.id}-${locationName}-${index}`}>
            <Popup>
              <strong>事件:</strong> {eventName} <br />
              <strong>地点:</strong> {locationName}
            </Popup>
          </Marker>
        );
      })
      .filter(Boolean);

    setMarkers(newMarkers);

    // 如果有标记点，将地图中心设置为第一个标记点的位置
    if (newMarkers.length > 0) {
        const firstMarkerCoordinates = geocode(data.find(item => {
            const locationName = item['Unnamed: 5'] || item.llm_processed?.location || item['地点'] || item['城市'];
            return locationName && typeof locationName === 'string' && geocode(locationName);
        })['Unnamed: 5'] || '北京');
        if(firstMarkerCoordinates) setMapCenter(firstMarkerCoordinates);
    }

  }, [data]); // 当数据变化时重新计算

  if (!data || data.length === 0) {
    return <div>当前朝代没有可显示的地理空间数据。</div>;
  }
  
  if (markers.length === 0) {
      return <div>在地图上没有找到当前数据的有效地理位置。</div>;
  }

  return (
    <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }} key={mapCenter.toString()}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers}
    </MapContainer>
  );
};

export default GeospatialView;

