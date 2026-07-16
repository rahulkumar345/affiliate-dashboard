import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS_LIST = [
  { to: '/', label: 'Overview' },
  { to: '/commissions', label: 'Commissions' },
  { to: '/payouts', label: 'Payouts' },
  { to: '/affiliates', label: 'Affiliates' },
  { to: '/settings', label: 'Program settings' },
];

export default function Layout() {
  const { userMap, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          Amplify<span>.</span>
        </div>
        <nav>
          {NAV_ITEMS_LIST.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="whoami">
          <div className="name">{userMap.name}</div>
          <div className="role">{userMap.role}</div>
          <div>
            <button onClick={logout}>Sign out</button>
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
