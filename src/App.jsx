//BEFORE YOU START MODIFYING THIS AND MAKING IT 10000000 LINES LONG, PLEASE ASK YOURSELF
//DOES THIS INCLUDE ANY BACKEND LOGIC? (EG. DATABASE CONNECTIONS, FILE I/O, SERIAL COMMUNICATIONS, ETC)
//DOES THIS INCLUDE ANY BUSINESS LOGIC? (EG. CALCULATIONS, DATA MANIPULATION, ETC)
//CAN THIS BE DONE IN A SIMPLER WAY? (EG. USING A LIBRARY, A FRAMEWORK, ETC)
//DOES THIS HAVE A LOT OF STYLING? (EG. CSS, JAVASCRIPT, ETC)
//IF YOU ANSWERED YES TO ANY OF THE ABOVE, PLEASE MOVE TO THE APPROPRIATE FILE, OR CREATE A NEW ONE
//THIS FILE SHOULD ONLY CONTAIN THE FRONTEND LOGIC, EG. REACT COMPONENTS, STATE MANAGEMENT, ETC

import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./styling/App.css";
import { Route, Link, Routes } from "react-router-dom";
import TestPage from "./pages/test.jsx";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
      <Link to="/test">Go to Test Page</Link>
      <Routes>
        <Route path="/" element={<div />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </main>
  );
}

export default App;
