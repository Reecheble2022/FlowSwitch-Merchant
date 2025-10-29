import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { useTheme } from '../providers/ThemeContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  FileText,
  X,
  Search,
  Bell,
  Wallet
} from 'lucide-react';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState(['Float & Vouchers']);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Merchants', href: '/merchants', icon: Building2 },
    {
      name: 'Float & Vouchers',
      href: '/float',
      icon: Wallet,
      subItems: [
        { name: 'Overview', href: '/float/overview' },
        { name: 'Float Accounts', href: '/float/accounts' },
        { name: 'Vouchers', href: '/float/vouchers' },
      ]
    },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Tools', href: '/tools', icon: Wrench },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-fs-bg dark:bg-fs-bgDark">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-glass transition-all duration-300 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
        } ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/50 dark:border-slate-800/50">
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-glow">
                FS
              </div>
              <span className="font-bold text-lg bg-gradient-brand bg-clip-text text-transparent">
                FlowSwitch
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-glow mx-auto">
              FS
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || item.subItems?.some((sub) => location.pathname === sub.href);
            const isExpanded = expandedItems.includes(item.name);
            const Icon = item.icon;

            if (item.subItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedItems(expandedItems.filter(name => name !== item.name));
                      } else {
                        setExpandedItems([...expandedItems, item.name]);
                      }
                    }}
                    className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-800/80'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-brand shadow-glow" />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-green' : ''}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && isExpanded && (
                    <div className="mt-1 ml-6 space-y-1">
                      {item.subItems.map((subItem) => {
                        const subIsActive = location.pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                              subIsActive
                                ? 'text-brand-green dark:text-brand-green bg-brand-green/10'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-800/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-brand shadow-glow" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-green' : ''}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Aever Attribution */}
        <div className={`border-t border-slate-200/50 dark:border-slate-800/50 p-4 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <a
            href="https://aever.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-400 transition-all duration-150"
            title="Aever — People Powered Platforms"
          >
            {sidebarCollapsed ? (
              <div className="w-6 h-6 flex items-center justify-center text-brand-cyan font-bold text-sm group-hover:scale-110 transition-transform">
                A
              </div>
            ) : (
              <>
                <img
                  src="/A picture.png"
                  alt="Aever"
                  className="h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className="font-medium">Built by Aever</span>
              </>
            )}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[220px]'}`}>
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-soft">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 min-w-[300px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Search className="w-4 h-4" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-auto text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-900">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-white dark:border-slate-900" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                ) : (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                )}
              </button>

              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold shadow-glow">
                    {getInitials(user?.name)}
                  </div>
                  {user?.name && (
                    <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {user.name}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-glass border border-slate-200/50 dark:border-slate-800/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
