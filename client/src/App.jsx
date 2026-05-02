import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./pages/Dashboard";
import Profile      from "./pages/Profile";
import Emergency    from "./pages/Emergency";
import MedicalDetails from "./pages/MedicalDetails";
import AccessHistory  from "./pages/AccessHistory";
import Staff        from "./pages/Staff";
import Settings     from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />}          />
        <Route path="/signup"    element={<Register />}       />
        <Route path="/dashboard" element={<Dashboard />}      />
        <Route path="/profile"   element={<Profile />}        />
        <Route path="/emergency" element={<Emergency />}      />
        <Route path="/medical"   element={<MedicalDetails />} />
        <Route path="/history"   element={<AccessHistory />}  />
        <Route path="/staff"     element={<Staff />}          />
        <Route path="/settings"  element={<Settings />}       />
      </Routes>
    </BrowserRouter>
  );
}