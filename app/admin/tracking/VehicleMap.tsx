"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { VehicleLocation } from "../../../lib/api";

const vehicleIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STATUS_ACCENT: Record<string, string> = {
  available: "#9BD8EA",
  assigned: "#0D5890",
  maintenance: "#F3D27A",
  inactive: "#5B7086",
};

export default function VehicleMap({ locations }: { locations: VehicleLocation[] }) {
  const center: [number, number] = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [8.5, 39.5];

  return (
    <MapContainer
      center={center}
      zoom={7}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {locations.map((vehicle) => (
        <Marker
          key={vehicle.vehicle_id}
          position={[vehicle.latitude, vehicle.longitude]}
          icon={vehicleIcon}
        >
          <Popup>
            <div className="osu-map-popup">
              <p className="osu-map-popup-title">{vehicle.registration_number}</p>
              <p className="osu-map-popup-line">
                {vehicle.make} {vehicle.model}
              </p>
              <p className="osu-map-popup-line">
                Status:{" "}
                <span
                  style={{ color: STATUS_ACCENT[vehicle.status] ?? "#9BD8EA" }}
                >
                  {vehicle.status}
                </span>
              </p>
              {vehicle.speed_kmh != null && (
                <p className="osu-map-popup-line">
                  Speed: {vehicle.speed_kmh.toFixed(0)} km/h
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}