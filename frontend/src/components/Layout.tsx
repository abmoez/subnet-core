import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Globe,
  Upload,
  LogOut,
  Menu,
  X,
  Server,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/subnets', icon: Network, label: 'Subnets' },
  { to: '/ips', icon: Globe, label: 'IP Addresses' },
  { to: '/upload', icon: Upload, label: 'Upload Bulk Data' },
];

function getPageTitle(pathname: string): string[] {
  if (pathname === '/') return ['Dashboard'];
  if (pathname === '/subnets') return ['Subnets'];
  if (pathname.startsWith('/subnets/')) return ['Subnets', 'Detail'];
  if (pathname === '/ips') return ['IP Addresses'];
  if (pathname === '/upload') return ['Upload Bulk Data'];
  return ['Dashboard'];
}

function UserAvatar({ email }: { email: string }) {
  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white">
      {initials || '?'}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const breadcrumbs = getPageTitle(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="relative">
            <Server className="h-7 w-7 text-primary-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
            </span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Subnet Core
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-300 shadow-sm shadow-primary-500/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-500/20'
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            {user?.email && <UserAvatar email={user.email} />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-200">
                {user?.email?.split('@')[0]}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="relative flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                )}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'font-semibold text-gray-900'
                      : 'text-gray-400'
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-500/0 via-primary-500/40 to-primary-500/0" />
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
