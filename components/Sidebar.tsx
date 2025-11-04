import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types';
import {
  DashboardIcon,
  TruckIcon,
  ShoppingCartIcon,
  DocumentReportIcon,
  UsersIcon,
  LogoutIcon,
} from './icons';

type Page = 'dashboard' | 'deliveries' | 'purchases' | 'reports' | 'employees';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  userProfile: UserProfile | null;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm md:text-base transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, userProfile }) => {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setMobileOpen(false); // close menu after click on mobile
  };

  const userName = userProfile?.name || 'User';
  const userRole = userProfile?.role || 'employee';

  // ---------------- MOBILE TOP BAR + MENU ----------------
  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex flex-col">
          <span className="font-semibold text-lg text-white">
            Warehouse Panel
          </span>
          <span className="text-xs text-gray-400">
            {userName} · {userRole}
          </span>
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center p-2 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800 focus:outline-none"
          aria-label="Toggle navigation"
        >
          {/* simple hamburger icon */}
          <span className="sr-only">Open main menu</span>
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </div>
        </button>
      </header>

      {/* Mobile dropdown nav */}
      <nav
        className={`md:hidden bg-gray-900 border-b border-gray-800 px-4 pb-3 space-y-1 transition-all ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        <NavItem
          icon={<DashboardIcon className="h-5 w-5" />}
          label="Dashboard"
          active={currentPage === 'dashboard'}
          onClick={() => handleNavClick('dashboard')}
        />
        <NavItem
          icon={<TruckIcon className="h-5 w-5" />}
          label="Deliveries"
          active={currentPage === 'deliveries'}
          onClick={() => handleNavClick('deliveries')}
        />
        <NavItem
          icon={<ShoppingCartIcon className="h-5 w-5" />}
          label="Purchases"
          active={currentPage === 'purchases'}
          onClick={() => handleNavClick('purchases')}
        />
        <NavItem
          icon={<DocumentReportIcon className="h-5 w-5" />}
          label="Reports"
          active={currentPage === 'reports'}
          onClick={() => handleNavClick('reports')}
        />
        <NavItem
          icon={<UsersIcon className="h-5 w-5" />}
          label="Employees"
          active={currentPage === 'employees'}
          onClick={() => handleNavClick('employees')}
        />

        <button
          onClick={signOut}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-300 hover:bg-red-900/40 hover:text-red-100 transition-colors"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen bg-gray-900 border-r border-gray-800 p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold text-lg">
            WH
          </div>
          <div>
            <p className="text-white font-semibold">Warehouse Panel</p>
            <p className="text-xs text-gray-400">
              {userName} · {userRole}
            </p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem
            icon={<DashboardIcon className="h-5 w-5" />}
            label="Dashboard"
            active={currentPage === 'dashboard'}
            onClick={() => handleNavClick('dashboard')}
          />
          <NavItem
            icon={<TruckIcon className="h-5 w-5" />}
            label="Deliveries"
            active={currentPage === 'deliveries'}
            onClick={() => handleNavClick('deliveries')}
          />
          <NavItem
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            label="Purchases"
            active={currentPage === 'purchases'}
            onClick={() => handleNavClick('purchases')}
          />
          <NavItem
            icon={<DocumentReportIcon className="h-5 w-5" />}
            label="Reports"
            active={currentPage === 'reports'}
            onClick={() => handleNavClick('reports')}
          />
          <NavItem
            icon={<UsersIcon className="h-5 w-5" />}
            label="Employees"
            active={currentPage === 'employees'}
            onClick={() => handleNavClick('employees')}
          />
        </nav>

        <button
          onClick={signOut}
          className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-300 hover:bg-red-900/40 hover:text-red-100 transition-colors"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
