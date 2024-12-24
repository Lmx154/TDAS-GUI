import React from "react";

function TelemetryDisplay({ telemetry }) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 border rounded mt-4 bg-white/30 backdrop-blur-md">
      <div className="p-2">
        <strong>Timestamp:</strong>
        <div>{telemetry.timestamp}</div>
      </div>
      <div className="p-2">
        <strong>Acceleration (m/s²):</strong>
        <div>X: {telemetry.accel_x.toFixed(2)}</div>
        <div>Y: {telemetry.accel_y.toFixed(2)}</div>
        <div>Z: {telemetry.accel_z.toFixed(2)}</div>
      </div>
      <div className="p-2">
        <strong>Gyroscope (deg/s):</strong>
        <div>X: {telemetry.gyro_x.toFixed(2)}</div>
        <div>Y: {telemetry.gyro_y.toFixed(2)}</div>
        <div>Z: {telemetry.gyro_z.toFixed(2)}</div>
      </div>
      <div className="p-2">
        <strong>IMU Temperature (°C):</strong>
        <div>{telemetry.imu_temp.toFixed(1)}</div>
      </div>
      <div className="p-2">
        <strong>BME Temperature (°C):</strong>
        <div>{telemetry.bme_temp.toFixed(1)}</div>
      </div>
      <div className="p-2">
        <strong>BME Pressure (hPa):</strong>
        <div>{telemetry.bme_pressure.toFixed(1)}</div>
      </div>
      <div className="p-2">
        <strong>BME Altitude (m):</strong>
        <div>{telemetry.bme_altitude.toFixed(1)}</div>
      </div>
      <div className="p-2">
        <strong>BME Humidity (%):</strong>
        <div>{telemetry.bme_humidity.toFixed(1)}</div>
      </div>
      <div className="p-2">
        <strong>GPS:</strong>
        <div>Fix: {telemetry.gps_fix}</div>
        <div>Fix Quality: {telemetry.gps_fix_quality}</div>
        <div>Satellites: {telemetry.gps_satellites}</div>
      </div>
      <div className="p-2">
        <strong>Position:</strong>
        <div>Lat: {telemetry.gps_lat.toFixed(4)}</div>
        <div>Lon: {telemetry.gps_lon.toFixed(4)}</div>
        <div>Speed: {telemetry.gps_speed.toFixed(2)} m/s</div>
        <div>Alt: {telemetry.gps_altitude.toFixed(1)} m</div>
      </div>
      <div className="p-2">
        <strong>Signal:</strong>
        <div>RSSI: {telemetry.rssi}</div>
        <div>SNR: {telemetry.snr.toFixed(2)}</div>
      </div>
    </div>
  );
}

export default TelemetryDisplay;
