import React from "react";

function TelemetryDisplay({ telemetry }) {
  return (
    <div className="w-[375px] grid grid-cols-3 gap-3 p-3 border rounded mt-4 bg-white/30 backdrop-blur-md text-sm">
      {/* Column 1: Motion Data */}
      <div className="space-y-2">
        <div className="p-1">
          <div><strong>Time:</strong> {telemetry.timestamp}</div>
          <div><strong>IMU T:</strong> {telemetry.imu_temp.toFixed(1)}°C</div>
        </div>
        <div className="border-t pt-1">
          <div><strong>Accel X:</strong> {telemetry.accel_x.toFixed(1)}</div>
          <div><strong>Accel Y:</strong> {telemetry.accel_y.toFixed(1)}</div>
          <div><strong>Accel Z:</strong> {telemetry.accel_z.toFixed(1)}</div>
        </div>
        <div className="border-t pt-1">
          <div><strong>Gyro X:</strong> {telemetry.gyro_x.toFixed(1)}</div>
          <div><strong>Gyro Y:</strong> {telemetry.gyro_y.toFixed(1)}</div>
          <div><strong>Gyro Z:</strong> {telemetry.gyro_z.toFixed(1)}</div>
        </div>
      </div>

      {/* Column 2: Environmental Data */}
      <div className="space-y-2 border-l pl-3">
        <div className="p-1">
          <div><strong>BME T:</strong> {telemetry.bme_temp.toFixed(1)}°C</div>
          <div><strong>BME H:</strong> {telemetry.bme_humidity.toFixed(0)}%</div>
          <div><strong>BME P:</strong> {telemetry.bme_pressure.toFixed(0)}hPa</div>
          <div><strong>BME Alt:</strong> {telemetry.bme_altitude.toFixed(0)}m</div>
        </div>
        <div className="border-t pt-1">
          <div><strong>RSSI:</strong> {telemetry.rssi}</div>
          <div><strong>SNR:</strong> {telemetry.snr.toFixed(1)}</div>
        </div>
      </div>

      {/* Column 3: GPS Data */}
      <div className="space-y-2 border-l pl-3">
        <div className="p-1">
          <div><strong>GPS Lat:</strong> {telemetry.gps_lat.toFixed(4)}</div>
          <div><strong>GPS Lon:</strong> {telemetry.gps_lon.toFixed(4)}</div>
          <div><strong>GPS Alt:</strong> {telemetry.gps_altitude.toFixed(0)}m</div>
          <div><strong>GPS Spd:</strong> {telemetry.gps_speed.toFixed(1)}m/s</div>
        </div>
        <div className="border-t pt-1">
          <div><strong>Satellites:</strong> {telemetry.gps_satellites}</div>
          <div><strong>Fix:</strong> {telemetry.gps_fix}</div>
          <div><strong>Quality:</strong> {telemetry.gps_fix_quality}</div>
        </div>
      </div>
    </div>
  );
}

export default TelemetryDisplay;
