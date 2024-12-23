import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

function TestPage() {
  const [portName, setPortName] = useState("");
  const [baudRate, setBaudRate] = useState("");
  const [connectionMsg, setConnectionMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [textFilePath, setTextFilePath] = useState("");
  const [fileList, setFileList] = useState([]);
  const [telemetry, setTelemetry] = useState({
    timestamp: "",
    accel_x: 0,
    accel_y: 0,
    accel_z: 0,
    gyro_x: 0,
    gyro_y: 0,
    gyro_z: 0,
    temp: 0,
    press_alt: 0,
    heading: 0,
    ground_speed: 0,
    gps_fix: 0,
    gps_num_sats: 0,
    gps_3d_fix: 0,
    latitude: 0,
    longitude: 0,
    altitude: 0,
    distance: 0,
    packet_number: 0,
    rssi: 0,
    snr: 0,
  });

  const telemetryBox = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    marginTop: '20px',
  };

  const telemetryItem = {
    padding: '10px',
    border: '1px solid #eee',
    borderRadius: '3px',
    backgroundColor: '#f5f5f5',
  };

  useEffect(() => {
    async function fetchFiles() {
      try {
        const files = await invoke("list_files");
        setFileList(files);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    }
    fetchFiles();

    // Listen for telemetry updates
    const unlisten = listen("telemetry-update", (event) => {
      setTelemetry(event.payload);
    });

    return () => {
      unlisten.then(f => f()); // Cleanup listener when component unmounts
    };
  }, []);

  async function openSerialPort() {
    try {
      const message = await invoke("open_serial", { portName, baudRate: parseInt(baudRate) });
      setConnectionMsg(message);
    } catch (error) {
      setConnectionMsg(`Error: ${error}`);
    }
  }

  async function createFile() {
    try {
      await invoke("create_text_file", { fileName });
      setConnectionMsg(`File ${fileName} created successfully`);
    } catch (error) {
      setConnectionMsg(`Error creating file: ${error}`);
    }
  }

  async function writeSerialToFile() {
    try {
      const result = await invoke("start_recording", { filePath: textFilePath });
      setConnectionMsg(result);
    } catch (error) {
      setConnectionMsg(`Error starting recording: ${error}`);
    }
  }

  async function startDataParsing() {
    try {
      await invoke("start_data_parser");
      setConnectionMsg("Data parser started");
    } catch (error) {
      setConnectionMsg(`Error starting data parser: ${error}`);
    }
  }

  return (
    <div>
      <h1>Test Page</h1>
      <form onSubmit={(e) => {
        e.preventDefault();
        openSerialPort();
      }}>
        <input
          type="text"
          placeholder="Port Name"
          value={portName}
          onChange={(e) => setPortName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Baud Rate"
          value={baudRate}
          onChange={(e) => setBaudRate(e.target.value)}
        />
        <button type="submit">Open Serial Port</button>
      </form>

      <div>
        <input
          type="text"
          placeholder="File Name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
        <button onClick={createFile}>Create File</button>
      </div>

      <div>
        <select
          value={textFilePath}
          onChange={(e) => setTextFilePath(e.target.value)}
        >
          <option value="">Select file</option>
          {fileList.map(([fileName, filePath]) => (
            <option key={filePath} value={filePath}>
              {fileName}
            </option>
          ))}
        </select>
      </div>

      <button onClick={writeSerialToFile}>Start Record</button>
      <button onClick={startDataParsing}>Start Data Parser</button>
      <p>{connectionMsg}</p>

      <div style={telemetryBox}>
        <div style={telemetryItem}>
          <strong>Timestamp:</strong>
          <div>{telemetry.timestamp}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Acceleration (m/s²):</strong>
          <div>X: {telemetry.accel_x.toFixed(2)}</div>
          <div>Y: {telemetry.accel_y.toFixed(2)}</div>
          <div>Z: {telemetry.accel_z.toFixed(2)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Gyroscope (deg/s):</strong>
          <div>X: {telemetry.gyro_x.toFixed(2)}</div>
          <div>Y: {telemetry.gyro_y.toFixed(2)}</div>
          <div>Z: {telemetry.gyro_z.toFixed(2)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Temperature (°C):</strong>
          <div>{telemetry.temp.toFixed(1)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Pressure Altitude (m):</strong>
          <div>{telemetry.press_alt.toFixed(1)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Heading (deg):</strong>
          <div>{telemetry.heading.toFixed(1)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Ground Speed (m/s):</strong>
          <div>{telemetry.ground_speed.toFixed(1)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>GPS:</strong>
          <div>Fix: {telemetry.gps_fix}</div>
          <div>Satellites: {telemetry.gps_num_sats}</div>
          <div>3D Fix: {telemetry.gps_3d_fix}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Position:</strong>
          <div>Lat: {telemetry.latitude.toFixed(4)}</div>
          <div>Lon: {telemetry.longitude.toFixed(4)}</div>
          <div>Alt: {telemetry.altitude.toFixed(1)}m</div>
        </div>
        <div style={telemetryItem}>
          <strong>Distance (m):</strong>
          <div>{telemetry.distance.toFixed(1)}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Packet:</strong>
          <div>Number: {telemetry.packet_number}</div>
        </div>
        <div style={telemetryItem}>
          <strong>Signal:</strong>
          <div>RSSI: {telemetry.rssi}</div>
          <div>SNR: {telemetry.snr.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default TestPage;