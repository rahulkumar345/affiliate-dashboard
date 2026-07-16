import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Commissions from './pages/Commissions.jsx';
import Payouts from './pages/Payouts.jsx';
import Affiliates from './pages/Affiliates.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { userMap } = useAuth();

  if (!userMap) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/commissions" element={<Commissions />} />
        <Route path="/payouts" element={<Payouts />} />
        <Route path="/affiliates" element={<Affiliates />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
