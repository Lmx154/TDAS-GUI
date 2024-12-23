import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function TestPage() {
  const [portName, setPortName] = useState("");
  const [baudRate, setBaudRate] = useState("");
  const [connectionMsg, setConnectionMsg] = useState("");

  async function openSerialPort() {
    try {
      const message = await invoke("open_serial", { portName, baudRate: parseInt(baudRate) });
      setConnectionMsg(message);
    } catch (error) {
      setConnectionMsg(`Error: ${error}`);
    }
  }

  return (
    <div>
      <h1>Test Page</h1>
      <input type="text" placeholder="Enter some text..." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openSerialPort();
        }}
      >
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
      <p>{connectionMsg}</p>
    </div>
  );
}

export default TestPage;
