import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link to="/employees" className="navbar-brand fw-bold">Employee Manager</Link>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light-emphasis">{user?.username}</span>
            <button className="btn btn-outline-light btn-sm" onClick={() => logout()}>Log out</button>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}
