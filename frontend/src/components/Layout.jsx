import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <Link to="/employees" className="brand">Employee Manager</Link>
        <div className="topbar-right">
          <span className="muted">{user?.username}</span>
          <button className="btn btn-ghost" onClick={() => logout()}>Log out</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
