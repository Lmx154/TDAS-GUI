import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { listen } from "@tauri-apps/api/event";
import TelemetryDisplay from "../components/telemetry_panel";
import RocketModel from "../components/3drocket";
import LineChart from "../components/charts";
import Map from "../components/map";
import Controls from "../components/controls";
import ThreeDChart from "../components/3dcharts";

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  const [selectedGraph, setSelectedGraph] = useState("Altitude"); // Ensure this is set to "Altitude"
  const [layouts, setLayouts] = useState(
    JSON.parse(localStorage.getItem("dashboardLayout")) || {
      lg: [
        { i: "gps", x: 0, y: 0, w: 4, h: 8 },
        { i: "telemetryCharts", x: 4, y: 0, w: 6, h: 8 },
        { i: "rocket3d", x: 0, y: 8, w: 4, h: 8 },
        { i: "controls", x: 4, y: 8, w: 4, h: 8 },
        { i: "telemetryDisplay", x: 8, y: 8, w: 4, h: 8 },
        { i: "trajectory", x: 0, y: 16, w: 6, h: 8 }
      ]
    }
  );

  useEffect(() => {
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
            bme_altitude: Number(event.payload.bme_altitude),
          },
        ];

        return newData.filter(
          (d) =>
            new Date(newData[newData.length - 1].timestamp) -
              new Date(d.timestamp) <=
            30000
        );
      });
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const renderGraph = () => {
    switch (selectedGraph) {
      case "Altitude":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.bme_altitude}
            color="orange"
            title="Altitude"
            width={600}
            height={400}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      case "BME Temperature":
        return (
          <LineChart
            data={telemetryData}
            xAccessor={(d) => new Date(d.timestamp)}
            yAccessor={(d) => d.bme_temp}
            color="red"
            title="BME Temperature"
            width={600} 
            height={400}
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
            width={600}  
            height={400}
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
            width={600}  
            height={400}
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
            width={600} 
            height={400}
            margin={{ top: 50, right: 30, bottom: 50, left: 50 }}
          />
        );
      default:
        return null;
    }
  };

  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
    localStorage.setItem("dashboardLayout", JSON.stringify(layouts));
  };

  return (
    <div className={`p-4 ${isDarkMode ? "text-white" : "text-black"}`}>
      <h1 className="text-2xl font-bold text-center mb-4">DAS GUI</h1>
      
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        isDraggable={true}
        isResizable={true}
      >
        <div key="gps" className="p-4 border rounded bg-white/30 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4">GPS Location</h2>
          <Map telemetry={telemetry} />
        </div>

        <div key="telemetryCharts" className="p-4 border rounded bg-white/30 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4">Telemetry Charts</h2>
          <select
            value={selectedGraph}
            onChange={(e) => setSelectedGraph(e.target.value)}
            className="border rounded p-2 text-black mb-4 w-full"
          >
            <option value="Altitude">Altitude</option>
            <option value="BME Temperature">BME Temperature</option>
            <option value="IMU Temperature">IMU Temperature</option>
            <option value="BME Pressure">BME Pressure</option>
            <option value="GPS Speed">GPS Speed</option>
          </select>
          {renderGraph()}
        </div>

        <div key="rocket3d" className="p-4 border rounded bg-white/30 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4">3D Rocket Visualization</h2>
          <RocketModel
            gyro_x={telemetry.gyro_x}
            gyro_y={telemetry.gyro_y}
            gyro_z={telemetry.gyro_z}
            accel_x={telemetry.accel_x}
            accel_y={telemetry.accel_y}
            accel_z={telemetry.accel_z}
          />
        </div>

        <div key="controls" className="p-4 border rounded bg-white/30 backdrop-blur-md">
          <Controls 
            portName={portName}
            setPortName={setPortName}
            baudRate={baudRate}
            setBaudRate={setBaudRate}
            fileName={fileName}
            setFileName={setFileName}
            textFilePath={textFilePath}
            setTextFilePath={setTextFilePath}
            portList={portList}
            setPortList={setPortList}
            fileList={fileList}
            setFileList={setFileList}
            connectionMsg={connectionMsg}
            setConnectionMsg={setConnectionMsg}
          />
        </div>

        <div key="telemetryDisplay" className="p-4 border rounded bg-white/30 backdrop-blur-md">
          <TelemetryDisplay telemetry={telemetry} />
        </div>

        <div key="trajectory" className="p-4 border rounded bg-white/30 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4">3D Trajectory Chart</h2>
          <ThreeDChart telemetry={telemetry} telemetryData={telemetryData} />
        </div>

      </ResponsiveGridLayout>
    </div>
  );
}

export default TestPage;