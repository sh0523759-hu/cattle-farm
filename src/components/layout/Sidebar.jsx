import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Milk,
  Wheat,
  Stethoscope,
  Syringe,
  Heart,
  Baby,
  ShoppingCart,
  Package,
  Users,
  UserCheck,
  Wrench,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileSpreadsheet,
  Settings,
  X,
  Sprout,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lock,
  ArrowLeftRight,
  Landmark,
  Wallet
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { PlanUpgradeModal } from '../common/PlanUpgradeModal';

export const hasFullErpAccess = (user) => {
  if (!user) return false;
  return true; // Full ERP Suite unlocked in standalone frontend mode
};

export const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse }) => {
  const { settings, showToast } = useFarm();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isPlanA = !hasFullErpAccess(user);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState('');

  // Collapsible dropdown groups
  const dropdownGroups = [
    {
      id: 'farm-management',
      name: 'FARM MANAGEMENT',
      isLocked: false,
      items: [
        { name: 'Animals', path: '/animals', icon: Milk },
        { name: 'Milk Production', path: '/milk', icon: Milk },
        { name: 'Feed Management', path: '/feed', icon: Wheat },
        { name: 'Health & Veterinary', path: '/health', icon: Stethoscope },
        { name: 'Vaccinations', path: '/vaccinations', icon: Syringe },
        { name: 'Breeding & Pregnancy', path: '/breeding', icon: Heart },
        { name: 'Calves', path: '/calves', icon: Baby },
        { name: 'Sales', path: '/sales', icon: ShoppingCart }
      ]
    },
    {
      id: 'operations',
      name: 'OPERATIONS',
      isLocked: isPlanA,
      items: [
        { name: 'Inventory', path: '/inventory', icon: Package },
        { name: 'Employees', path: '/employees', icon: Users },
        { name: 'Customers', path: '/customers', icon: UserCheck },
        { name: 'Equipment', path: '/equipment', icon: Wrench }
      ]
    },
    {
      id: 'finance',
      name: 'FINANCE',
      isLocked: isPlanA,
      items: [
        {
          id: 'cash-flow',
          name: 'Cash Flow',
          icon: ArrowLeftRight,
          isSubmenu: true,
          subItems: [
            { name: 'Cash Flow Overview', path: '/cash-flow', icon: ArrowLeftRight },
            { name: 'Income', path: '/income', icon: TrendingUp },
            { name: 'Expenses', path: '/expenses', icon: TrendingDown }
          ]
        },
        { name: 'Accounts', path: '/accounts', icon: Landmark },
        { name: 'Payroll', path: '/payroll', icon: Wallet },
        { name: 'Profit & Loss', path: '/profit-loss', icon: PieChart }
      ]
    }
  ];

  // Accordion state
  const [openGroups, setOpenGroups] = useState({
    'farm-management': true,
    'operations': !isPlanA,
    'finance': !isPlanA
  });

  // Nested submenu state (e.g. Cash Flow dropdown)
  const [openSubmenus, setOpenSubmenus] = useState({
    'cash-flow': true
  });

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Auto-open dropdown group or submenu if current path is inside it
  useEffect(() => {
    dropdownGroups.forEach((g) => {
      let groupHasMatch = false;
      g.items.forEach((item) => {
        if (item.path === location.pathname) {
          groupHasMatch = true;
        }
        if (item.subItems && item.subItems.some((sub) => sub.path === location.pathname)) {
          groupHasMatch = true;
          setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        }
      });
      if (groupHasMatch) {
        setOpenGroups((prev) => ({ ...prev, [g.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isDashboardActive = location.pathname === '/';

  return (
    <>
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureName={upgradeModalFeature}
      />

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen max-h-screen z-50 bg-[#0b2519] text-slate-100 flex flex-col transition-all duration-300 shadow-2xl overscroll-contain ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-emerald-900/50 bg-[#071911] flex-shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {isCollapsed ? (
            /* Collapsed Mode */
            <button
              onClick={toggleCollapse}
              className="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-white transition-all cursor-pointer group relative"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <Sprout className="w-5 h-5 transition-transform group-hover:scale-110" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#071911] border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                <ChevronRight className="w-2.5 h-2.5" />
              </div>
            </button>
          ) : (
            /* Expanded Mode */
            <>
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex-shrink-0">
                  <Sprout className="w-5 h-5" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-extrabold text-base tracking-wide text-white leading-tight truncate">
                    {settings.farmName || "Cattle ERP"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Management ERP
                    </span>
                    {isPlanA && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold uppercase">
                        Plan A
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Collapse Button */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-emerald-900/60 transition-colors border border-emerald-800/40 cursor-pointer items-center justify-center"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-900/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation List */}
        <div className={`flex-1 overflow-y-auto no-scrollbar py-3.5 space-y-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {/* Top Dashboard Item */}
          <div className="space-y-1">
            {(!isCollapsed || isOpen) && (
              <h4 className="px-3 text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest mb-1.5">
                MAIN
              </h4>
            )}
            <NavLink
              to="/"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group ${
                isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
              } ${
                isDashboardActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40'
                  : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
              }`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${isDashboardActive ? 'text-white' : 'text-emerald-400/80 group-hover:text-emerald-300'}`} />
              {(!isCollapsed || isOpen) && (
                <span className="truncate flex-1">Dashboard</span>
              )}
            </NavLink>
          </div>

          {/* Collapsible Dropdown Groups */}
          {dropdownGroups.map((group) => {
            const isOpenGroup = !!openGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header / Toggle Button */}
                {(!isCollapsed || isOpen) ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-200 uppercase tracking-wider transition-colors cursor-pointer select-none"
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {group.name}
                      {group.isLocked && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black tracking-normal border border-amber-500/30 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>LOCKED</span>
                        </span>
                      )}
                    </span>
                    {isOpenGroup ? (
                      <ChevronDown className="w-4 h-4 text-emerald-400/80" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-emerald-400/80" />
                    )}
                  </button>
                ) : (
                  <div className="h-px bg-emerald-900/40 my-1.5" />
                )}

                {/* Dropdown Group Items */}
                {(isOpenGroup || isCollapsed) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isLockedItem = group.isLocked;

                      // If this item is a Submenu (e.g. Cash Flow -> Cash Flow Overview, Income, Expenses)
                      if (item.isSubmenu) {
                        const isChildActive = item.subItems.some((sub) => sub.path === location.pathname);
                        const isOpenSub = !!openSubmenus[item.id];

                        if (isCollapsed) {
                          return (
                            <NavLink
                              key={item.id}
                              to={item.subItems[0].path}
                              onClick={(e) => {
                                if (isLockedItem) {
                                  e.preventDefault();
                                  setUpgradeModalFeature(item.name);
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                              }}
                              className={`flex items-center justify-center py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group px-0 ${
                                isChildActive && !isLockedItem
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-950/30'
                                  : isLockedItem
                                  ? 'text-slate-400 hover:text-amber-200 hover:bg-amber-950/20'
                                  : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
                              }`}
                              title={isLockedItem ? `${item.name} (Plan B Locked)` : item.name}
                            >
                              <Icon className={`w-4 h-4 flex-shrink-0 ${
                                isChildActive && !isLockedItem
                                  ? 'text-white'
                                  : isLockedItem
                                  ? 'text-amber-400/70 group-hover:text-amber-300'
                                  : 'text-emerald-400/80 group-hover:text-emerald-300'
                              }`} />
                            </NavLink>
                          );
                        }

                        return (
                          <div key={item.id} className="space-y-1">
                            {/* Submenu Header Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isLockedItem) {
                                  setUpgradeModalFeature(item.name);
                                  setIsUpgradeModalOpen(true);
                                  return;
                                }
                                toggleSubmenu(item.id);
                              }}
                              className={`w-full flex items-center justify-between py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group px-3 cursor-pointer ${
                                isLockedItem
                                  ? 'text-slate-400 hover:text-amber-200 hover:bg-amber-950/20'
                                  : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-3 truncate">
                                <Icon className={`w-4 h-4 flex-shrink-0 ${
                                  isLockedItem
                                    ? 'text-amber-400/70 group-hover:text-amber-300'
                                    : 'text-emerald-400/80 group-hover:text-emerald-300'
                                }`} />
                                <span className="truncate">{item.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isLockedItem && (
                                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                                {isOpenSub ? (
                                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                                )}
                              </div>
                            </button>

                            {/* Indented Submenu items with green line on left */}
                            {isOpenSub && (
                              <div className="ml-5 pl-2.5 border-l-2 border-emerald-500/70 space-y-1 my-1">
                                {item.subItems.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const isSubActive = location.pathname === sub.path;

                                  return (
                                    <NavLink
                                      key={sub.path}
                                      to={sub.path}
                                      onClick={(e) => {
                                        if (isLockedItem) {
                                          e.preventDefault();
                                          setUpgradeModalFeature(sub.name);
                                          setIsUpgradeModalOpen(true);
                                          return;
                                        }
                                        if (window.innerWidth < 1024) onClose();
                                      }}
                                      className={`flex items-center py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group space-x-3 px-3 ${
                                        isSubActive && !isLockedItem
                                          ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-950/30'
                                          : isLockedItem
                                          ? 'text-slate-400 hover:text-amber-200 hover:bg-amber-950/20'
                                          : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
                                      }`}
                                    >
                                      <SubIcon className={`w-4 h-4 flex-shrink-0 ${
                                        isSubActive && !isLockedItem
                                          ? 'text-white'
                                          : isLockedItem
                                          ? 'text-amber-400/70 group-hover:text-amber-300'
                                          : 'text-emerald-400/80 group-hover:text-emerald-300'
                                      }`} />
                                      <div className="flex-1 flex items-center justify-between truncate">
                                        <span className="truncate">{sub.name}</span>
                                        {isLockedItem && (
                                          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                                        )}
                                      </div>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Regular Item
                      const isActive = location.pathname === item.path;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={(e) => {
                            if (isLockedItem) {
                              e.preventDefault();
                              setUpgradeModalFeature(item.name);
                              setIsUpgradeModalOpen(true);
                              return;
                            }
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`flex items-center py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group ${
                            isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
                          } ${
                            isActive && !isLockedItem
                              ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-950/30'
                              : isLockedItem
                              ? 'text-slate-400 hover:text-amber-200 hover:bg-amber-950/20'
                              : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
                          }`}
                          title={isCollapsed ? (isLockedItem ? `${item.name} (Plan B Locked)` : item.name) : undefined}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${
                            isActive && !isLockedItem 
                              ? 'text-white' 
                              : isLockedItem 
                              ? 'text-amber-400/70 group-hover:text-amber-300' 
                              : 'text-emerald-400/80 group-hover:text-emerald-300'
                          }`} />
                          
                          {(!isCollapsed || isOpen) && (
                            <div className="flex-1 flex items-center justify-between truncate">
                              <span className="truncate">{item.name}</span>
                              {isLockedItem && (
                                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                              )}
                            </div>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Separate Bottom Items (Reports & Settings) */}
          <div className="pt-2.5 border-t border-emerald-900/40 space-y-1">
            {(!isCollapsed || isOpen) && (
              <h4 className="px-3 text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest mb-1.5">
                SYSTEM & REPORTS
              </h4>
            )}
            
            {/* Reports */}
            <NavLink
              to="/reports"
              onClick={(e) => {
                if (isPlanA) {
                  e.preventDefault();
                  setUpgradeModalFeature('Reports & Custom Exports');
                  setIsUpgradeModalOpen(true);
                  return;
                }
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group ${
                isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
              } ${
                location.pathname === '/reports' && !isPlanA
                  ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-950/30'
                  : isPlanA
                  ? 'text-slate-400 hover:text-amber-200 hover:bg-amber-950/20'
                  : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
              }`}
              title={isCollapsed ? (isPlanA ? 'Reports (Plan B Locked)' : 'Reports') : undefined}
            >
              <FileSpreadsheet className={`w-4 h-4 flex-shrink-0 ${
                location.pathname === '/reports' && !isPlanA 
                  ? 'text-white' 
                  : isPlanA 
                  ? 'text-amber-400/70 group-hover:text-amber-300' 
                  : 'text-emerald-400/80 group-hover:text-emerald-300'
              }`} />
              {(!isCollapsed || isOpen) && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">Reports</span>
                  {isPlanA && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                </div>
              )}
            </NavLink>

            {/* Settings */}
            <NavLink
              to="/settings"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center py-2 rounded-xl font-medium text-[13.5px] leading-snug transition-all group ${
                isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'
              } ${
                location.pathname === '/settings'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-950/30'
                  : 'text-slate-200 hover:bg-emerald-900/40 hover:text-white'
              }`}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings className={`w-4 h-4 flex-shrink-0 ${location.pathname === '/settings' ? 'text-white' : 'text-emerald-400/80 group-hover:text-emerald-300'}`} />
              {(!isCollapsed || isOpen) && (
                <span className="truncate flex-1">Settings</span>
              )}
            </NavLink>
          </div>
        </div>

        {/* User Footer Profile */}
        {(!isCollapsed || isOpen) ? (
          <div className="p-3 border-t border-emerald-900/50 bg-[#071911] flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-3 px-1.5 py-1 rounded-xl truncate flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-inner flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : (settings.ownerName ? settings.ownerName.charAt(0) : 'A')}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-100 truncate leading-tight">{user?.name || settings.ownerName || 'Farm Admin'}</span>
                <span className="text-[10.5px] text-emerald-400/90 truncate leading-tight">{user?.email || settings.phone}</span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                showToast('Logged out successfully!', 'info');
                navigate('/login');
              }}
              title="Logout"
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-emerald-900/50 bg-[#071911] flex-shrink-0 flex items-center justify-center">
            <button
              onClick={() => {
                logout();
                showToast('Logged out successfully!', 'info');
                navigate('/login');
              }}
              title="Logout"
              className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-rose-900 text-white flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
