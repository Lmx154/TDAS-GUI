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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  const [selectedGraph, setSelectedGraph] = useState("BME Temperature");

  // Define fetchFiles function
  async function fetchFiles() {
    try {
      const files = await invoke("list_files");
      setFileList(files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }

  useEffect(() => {
    // Call fetchFiles
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

      setTelemetryData((prevData) => {
        const newData = [
          ...prevData,
          {
            timestamp: event.payload.timestamp,
            bme_temp: Number(event.payload.bme_temp),
            imu_temp: Number(event.payload.imu_temp),
            bme_pressure: Number(event.payload.bme_pressure),
            gps_speed: Number(event.payload.gps_speed),
          },
        ];

        // Limit to last 30 seconds of data
        return newData.filter(
          (d) =>
            new Date(newData[newData.length - 1].timestamp) -
              new Date(d.timestamp) <=
            30000
        );
      });
    });

    return () => {
      unlisten.then((f) => f()); // Cleanup listener when component unmounts
    };
  }, []);

  async function openSerialPort() {
    try {
      const message = await invoke("open_serial", {
        portName,
        baudRate: parseInt(baudRate),
      });
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

  const renderGraph = () => {
    switch (selectedGraph) {
      case "BME Temperature":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.bme_temp}
            color="red"
            title="BME Temperature"
            width={800}
            height={300}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      case "IMU Temperature":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.imu_temp}
            color="blue"
            title="IMU Temperature"
            width={800}
            height={300}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      case "BME Pressure":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.bme_pressure}
            color="green"
            title="BME Pressure"
            width={800}
            height={300}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      case "GPS Speed":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.gps_speed}
            color="purple"
            title="GPS Speed"
            width={800}
            height={300}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      case "Velocity Over Time":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.velocity}
            color="orange"
            title="Velocity Over Time"
            width={800}
            height={300}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 ${isDarkMode ? "text-white" : "text-black"}`}>
      <h1 className="text-2xl font-bold text-center mb-4">Test Page</h1>
      
      {/* Main content area */}
      <div className="flex flex-col h-full">
        {/* Upper section with rocket model and chart */}
        <div className="flex justify-center gap-8 mb-4">
          {/* 3D Rocket container */}
          <div className="w-[400px] p-4 border rounded bg-white/30 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4">3D Rocket Visualization</h2>
            <RocketModel
              gyro_x={telemetry.gyro_x}
              gyro_y={telemetry.gyro_y}
              gyro_z={telemetry.gyro_z}
            />
          </div>

          {/* Chart container */}
          <div className="w-[600px] p-4 border rounded bg-white/30 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4">Telemetry Charts</h2>
            <select
              value={selectedGraph}
              onChange={(e) => setSelectedGraph(e.target.value)}
              className="border rounded p-2 text-black mb-4 w-full"
            >
              <option value="BME Temperature">BME Temperature</option>
              <option value="IMU Temperature">IMU Temperature</option>
              <option value="BME Pressure">BME Pressure</option>
              <option value="GPS Speed">GPS Speed</option>
              <option value="Velocity Over Time">Velocity Over Time</option>
            </select>
            {renderGraph()}
          </div>
        </div>

        {/* Bottom section with controls and telemetry side by side */}
        <div className="flex justify-center gap-8 mt-auto">
          {/* Controls section */}
          <div className="w-[420px] p-4 border rounded bg-white/30 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-4">Controls</h2>
            <div className="flex flex-col space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  openSerialPort();
                }}
                className="flex flex-wrap gap-2"
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
                  className="border rounded p-2 mr-2 text-black w-24"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                  Open Serial Port
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
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

              <div className="flex flex-wrap gap-2">
                <select
                  value={textFilePath}
                  onChange={(e) => setTextFilePath(e.target.value)}
                  onClick={fetchFiles}
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

              <div className="flex flex-wrap gap-2">
                <button onClick={writeSerialToFile} className="bg-blue-500 text-white p-2 rounded mr-2">
                  Start Record
                </button>
                <button onClick={startDataParsing} className="bg-blue-500 text-white p-2 rounded">
                  Start Data Parser
                </button>
              </div>
              <p className="mt-4">{connectionMsg}</p>
            </div>
          </div>

          {/* Telemetry panel */}
          <div className="w-[375px]">
            <TelemetryDisplay telemetry={telemetry} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPage;