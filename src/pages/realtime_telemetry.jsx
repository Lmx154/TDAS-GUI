import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import TelemetryDisplay from "../components/telemetry_panel";
import RocketModel from "../components/3drocket";
import LineChart from "../components/charts";

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

  const [telemetryData, setTelemetryData] = useState([]);

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
      setTelemetryData(prevData => [...prevData, event.payload]);
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
      <RocketModel gyro_x={telemetry.gyro_x} gyro_y={telemetry.gyro_y} gyro_z={telemetry.gyro_z} />

      <LineChart
        data={telemetryData}
        xAccessor={d => new Date(d.timestamp)}
        yAccessor={d => d.bme_temp}
        color="red"
        title="BME Temperature"
        width={800}
        height={300}
        margin={{ top: 50, right: 30, bottom: 30, left: 50 }}
        animationDuration={2000}
        timeWindow={30000}
      />
      <LineChart
        data={telemetryData}
        xAccessor={d => new Date(d.timestamp)}
        yAccessor={d => d.imu_temp}
        color="blue"
        title="IMU Temperature"
        width={800}
        height={300}
        margin={{ top: 50, right: 30, bottom: 30, left: 50 }}
        animationDuration={2000}
        timeWindow={30000}
      />
      <LineChart
        data={telemetryData}
        xAccessor={d => new Date(d.timestamp)}
        yAccessor={d => d.bme_pressure}
        color="green"
        title="BME Pressure"
        width={800}
        height={300}
        margin={{ top: 50, right: 30, bottom: 30, left: 50 }}
        animationDuration={2000}
        timeWindow={30000}
      />
      <LineChart
        data={telemetryData}
        xAccessor={d => new Date(d.timestamp)}
        yAccessor={d => d.gps_speed}
        color="purple"
        title="GPS Speed"
        width={800}
        height={300}
        margin={{ top: 50, right: 30, bottom: 30, left: 50 }}
        animationDuration={2000}
        timeWindow={30000}
      />
    </div>
  );
}

export default TestPage;