import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronRight, User, AlertTriangle, AlertCircle, CheckCircle2, LogOut, Settings, ChevronDown, Clock, Calendar } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onMobileMenuToggle, isCollapsed, onDesktopCollapseToggle }) => {
  const { alerts, settings, showToast } = useFarm();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Real-time clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Map routes to human readable titles
  const routeTitles = {
    '/': 'Farm Overview Dashboard',
    '/animals': 'Animal Registry & Herd Management',
    '/milk': 'Milk Production Records',
    '/feed': 'Feed Inventory & Stock Management',
    '/health': 'Health & Veterinary Care',
    '/vaccinations': 'Vaccination Schedules & Reminders',
    '/medicines': 'Medicine Stock & Expiry Control',
    '/breeding': 'Breeding & Pregnancy Tracking',
    '/calves': 'Calf Registry & Growth Tracking',
    '/inventory': 'Farm Asset Inventory',
    '/equipment': 'Equipment & Machinery Maintenance',
    '/employees': 'Employee & Attendance Directory',
    '/customers': 'Milk Buyers & Customer Directory',
    '/cash-flow': 'Cash Flow Ledger',
    '/cashflow': 'Cash Flow Ledger',
    '/income': 'Farm Revenue & Sales',
    '/expenses': 'Operational Expenses Logger',
    '/accounts': 'Accounts & Banking Manager',
    '/payroll': 'Staff Payroll & Salaries',
    '/profit-loss': 'Financial Profit & Loss Statement',
    '/reports': 'Farm Analytics & Custom Reports',
    '/settings': 'System & Farm Configuration'
  };

  const getBreadcrumbName = (path) => {
    const clean = path.replace('/', '').toLowerCase();
    if (!clean) return 'Dashboard';
    if (clean === 'cash-flow' || clean === 'cashflow') return 'Cash-Flow';
    if (clean === 'profit-loss') return 'Profit-Loss';
    if (clean === 'accounts') return 'Accounts';
    if (clean === 'payroll') return 'Payroll';
    if (clean === 'income') return 'Income';
    if (clean === 'expenses') return 'Expenses';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const currentTitle = settings.farmName || 'Cattle Farm ERP';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs px-4 lg:px-8 h-16 flex items-center justify-between">
      {/* Left side: Hamburger & Titles */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Title */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-400">
            <span>CattlePro ERP</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-emerald-700 capitalize">{getBreadcrumbName(location.pathname)}</span>
          </div>
          <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight hidden sm:block">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right side: Live Clock, Notifications, Profile */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Real-time Date & Clock Widget */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-900 shadow-2xs">
          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold tracking-wide text-slate-800 leading-tight">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700/90 leading-tight">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Notification Bell Dropdown */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-800">Farm Alerts</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                    {alerts.length} New
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(alert.link);
                      }}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3"
                    >
                      {alert.type === 'danger' ? (
                        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800">{alert.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{alert.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="font-semibold text-slate-600">All Clear!</span>
                    <span>No active alerts or warnings at this moment.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-700 leading-tight">
                {user?.name || settings.farmName || "Farm Admin"}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold leading-tight">
                {user?.role || "Farm Manager"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-xs font-extrabold text-slate-800 truncate">{user?.name || 'Farm Admin'}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@cattleerp.com'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {user?.role || 'Farm Manager'}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Farm & Account Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Dashboard Overview</span>
                </button>
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    showToast('Logged out successfully!', 'info');
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
