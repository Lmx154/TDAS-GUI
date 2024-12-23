import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function TestPage() {
  const [portName, setPortName] = useState("");
  const [baudRate, setBaudRate] = useState("");
  const [connectionMsg, setConnectionMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [textFilePath, setTextFilePath] = useState("");
  const [fileList, setFileList] = useState([]);

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
      <p>{connectionMsg}</p>
    </div>
  );
}

export default TestPage;
