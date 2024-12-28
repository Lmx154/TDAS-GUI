//BEFORE YOU START MODIFYING THIS AND MAKING IT 10000000 LINES LONG, PLEASE ASK YOURSELF
//DOES THIS INCLUDE ANY BACKEND LOGIC? (EG. DATABASE CONNECTIONS, FILE I/O, SERIAL COMMUNICATIONS, ETC)
//DOES THIS INCLUDE ANY BUSINESS LOGIC? (EG. CALCULATIONS, DATA MANIPULATION, ETC)
//CAN THIS BE DONE IN A SIMPLER WAY? (EG. USING A LIBRARY, A FRAMEWORK, ETC)
//DOES THIS HAVE A LOT OF STYLING? (EG. CSS, JAVASCRIPT, ETC)
//IF YOU ANSWERED YES TO ANY OF THE ABOVE, PLEASE MOVE TO THE APPROPRIATE FILE, OR CREATE A NEW ONE
//THIS FILE SHOULD ONLY CONTAIN THE FRONTEND LOGIC, EG. REACT COMPONENTS, STATE MANAGEMENT, ROUTING, ETC

import './index.css';
import { Route, Routes, Navigate } from "react-router-dom";
import TestPage from "./pages/realtime_telemetry.jsx";
import { LayoutProvider } from './context/LayoutContext';
// ...import other pages as needed...

function App() {
  return (
    <LayoutProvider>
      <div className="h-full w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/test" />} />
          <Route path="/test" element={<TestPage />} />
          {/* Add more routes to other pages here */}
        </Routes>
      </div>
    </LayoutProvider>
  );
}

export default App;
