import React, { useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";

function Controls({ 
  portName, 
  setPortName, 
  baudRate, 
  setBaudRate, 
  fileName, 
  setFileName, 
  textFilePath, 
  setTextFilePath,
  portList,
  setPortList,
  fileList,
  setFileList,
  connectionMsg,
  setConnectionMsg
}) {
  // Fetch ports and files on component mount
  useEffect(() => {
    fetchPorts();
    fetchFiles();
  }, []);

  async function fetchPorts() {
    try {
      const ports = await invoke("list_serial_ports");
      setPortList(ports);
    } catch (error) {
      console.error("Error fetching ports:", error);
    }
  }

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
      fetchFiles(); // Refresh file list after creating new file
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
  );
}

export default Controls;
