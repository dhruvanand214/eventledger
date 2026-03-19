import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Entry from "./pages/Entry";
import Bartender from "./pages/Bartender";
import Exit from "./pages/Exit";
import OwnerDashboard from "./pages/OwnerDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Admin from "./pages/Admin";
import GlobalLoader from "./components/GlobalLoader";

function App() {
  return (
    <BrowserRouter>
      <GlobalLoader />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/entry"
          element={
            <ProtectedRoute allowedRoles={["entry"]}>
              <Layout>
                <Entry />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bartender"
          element={
            <ProtectedRoute allowedRoles={["bartender"]}>
              <Layout>
                <Bartender />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exit"
          element={
            <ProtectedRoute allowedRoles={["exit"]}>
              <Layout>
                <Exit />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <OwnerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
