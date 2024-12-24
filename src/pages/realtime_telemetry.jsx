import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

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

function TestPage() {
  const [portName, setPortName] = useState("");
  const [baudRate, setBaudRate] = useState("115200");
  const [connectionMsg, setConnectionMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [textFilePath, setTextFilePath] = useState("");
  const [fileList, setFileList] = useState([]);
  const [portList, setPortList] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false); // Change text to black or white
  const [telemetry, setTelemetry] = useState({
    timestamp: "",
    accel_x: 0,
    accel_y: 0,
    accel_z: 0,
    gyro_x: 0,
    gyro_y: 0,
    gyro_z: 0,
    imu_temp: 0,
    bme_temp: 0,
    bme_pressure: 0,
    bme_altitude: 0,
    bme_humidity: 0,
    gps_fix: 0,
    gps_fix_quality: 0,
    gps_lat: 0,
    gps_lon: 0,
    gps_speed: 0,
    gps_altitude: 0,
    gps_satellites: 0,
    rssi: 0,
    snr: 0,
  });

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

    async function fetchPorts() {
      try {
        const ports = await invoke("list_serial_ports");
        setPortList(ports);
      } catch (error) {
        console.error("Error fetching ports:", error);
      }
    }
    fetchPorts();

    // Listen for telemetry updates
    const unlisten = listen("telemetry-update", (event) => {
      setTelemetry(event.payload);
    });

    return () => {
      unlisten.then(f => f()); // Cleanup listener when component unmounts
    };
  }, []);

  async function fetchFiles() {
    try {
      const files = await invoke("list_files");
      setFileList(files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }

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
    <div className={`p-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
      <h1 className="text-2xl font-bold text-center mb-4">Test Page</h1>
      <div className="p-4 border rounded bg-white/30 backdrop-blur-md mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openSerialPort();
          }}
          className="mb-4"
        >
          <select
            value={portName}
            onChange={(e) => setPortName(e.target.value)}
            className="border rounded p-2 mr-2 text-black"
          >
            <option value="">Select Port</option>
            {portList.map((port) => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Baud Rate"
            value={baudRate}
            onChange={(e) => setBaudRate(e.target.value)}
            className="border rounded p-2 mr-2 text-black w-24" // Adjusted width
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Open Serial Port
          </button>
        </form>

        <div className="mb-4">
          <input
            type="text"
            placeholder="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="border rounded p-2 mr-2 text-black"
          />
          <button onClick={createFile} className="bg-blue-500 text-white p-2 rounded">
            Create File
          </button>
        </div>

        <div className="mb-4">
          <select
            value={textFilePath}
            onChange={(e) => setTextFilePath(e.target.value)}
            onClick={fetchFiles} // Fetch files every time the dropdown is clicked
            className="border rounded p-2 text-black"
          >
            <option value="">Select file</option>
            {fileList.map(([fileName, filePath]) => (
              <option key={filePath} value={filePath}>
                {fileName}
              </option>
            ))}
          </select>
        </div>

        <button onClick={writeSerialToFile} className="bg-blue-500 text-white p-2 rounded mr-2">
          Start Record
        </button>
        <button onClick={startDataParsing} className="bg-blue-500 text-white p-2 rounded">
          Start Data Parser
        </button>
        <p className="mt-4">{connectionMsg}</p>
      </div>

      <TelemetryDisplay telemetry={telemetry} />
    </div>
  );
}

export default TestPage;