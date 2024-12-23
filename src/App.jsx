//BEFORE YOU START MODIFYING THIS AND MAKING IT 10000000 LINES LONG, PLEASE ASK YOURSELF
//DOES THIS INCLUDE ANY BACKEND LOGIC? (EG. DATABASE CONNECTIONS, FILE I/O, SERIAL COMMUNICATIONS, ETC)
//DOES THIS INCLUDE ANY BUSINESS LOGIC? (EG. CALCULATIONS, DATA MANIPULATION, ETC)
//CAN THIS BE DONE IN A SIMPLER WAY? (EG. USING A LIBRARY, A FRAMEWORK, ETC)
//DOES THIS HAVE A LOT OF STYLING? (EG. CSS, JAVASCRIPT, ETC)
//IF YOU ANSWERED YES TO ANY OF THE ABOVE, PLEASE MOVE TO THE APPROPRIATE FILE, OR CREATE A NEW ONE
//THIS FILE SHOULD ONLY CONTAIN THE FRONTEND LOGIC, EG. REACT COMPONENTS, STATE MANAGEMENT, ETC

import { Route, Link, Routes } from "react-router-dom";
import TestPage from "./pages/test.jsx";

function App() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-xl font-bold text-red-500">Welcome</h1>
      <Link to="/test" className="text-blue-500 hover:underline">
        Go to Test Page
      </Link>
      <Routes>
        <Route path="/" element={<div />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </main>
  );
}

export default App;
