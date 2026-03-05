import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Login from "./pages/Login";
import Entry from "./pages/Entry";
// import Bartender from "./pages/Bartender";
// import Exit from "./pages/Exit";
// import OwnerDashboard from "./pages/OwnerDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Login />} /> */}
        <Route path="/entry" element={<Entry />} />
        {/* <Route path="/bartender" element={<Bartender />} /> */}
        {/* <Route path="/exit" element={<Exit />} /> */}
        {/* <Route path="/owner" element={<OwnerDashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
