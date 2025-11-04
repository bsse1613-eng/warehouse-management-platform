
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types';
import { DashboardIcon, TruckIcon, ShoppingCartIcon, DocumentReportIcon, UsersIcon, LogoutIcon } from './icons';

type Page = 'dashboard' | 'deliveries' | 'purchases' | 'reports' | 'employees';

interface SidebarProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    userProfile: UserProfile | null;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, userProfile }) => {
    const { signOut } = useAuth();

    return (
        <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between no-print">
            <div>
                <div className="text-white text-2xl font-bold mb-8 px-2">
                    Alankar Agro
                </div>
                <nav className="space-y-2">
                    <NavItem
                        icon={<DashboardIcon className="h-6 w-6" />}
                        label="Dashboard"
                        isActive={currentPage === 'dashboard'}
                        onClick={() => setCurrentPage('dashboard')}
                    />
                    <NavItem
                        icon={<TruckIcon className="h-6 w-6" />}
                        label="Deliveries"
                        isActive={currentPage === 'deliveries'}
                        onClick={() => setCurrentPage('deliveries')}
                    />
                    <NavItem
                        icon={<ShoppingCartIcon className="h-6 w-6" />}
                        label="Purchases"
                        isActive={currentPage === 'purchases'}
                        onClick={() => setCurrentPage('purchases')}
                    />
                    <NavItem
                        icon={<DocumentReportIcon className="h-6 w-6" />}
                        label="Reports"
                        isActive={currentPage === 'reports'}
                        onClick={() => setCurrentPage('reports')}
                    />
                    {userProfile?.role === 'owner' && (
                        <NavItem
                            icon={<UsersIcon className="h-6 w-6" />}
                            label="Employees"
                            isActive={currentPage === 'employees'}
                            onClick={() => setCurrentPage('employees')}
                        />
                    )}
                </nav>
            </div>
            <div>
                <div className="px-4 py-3 border-t border-gray-700">
                    <p className="text-white font-semibold">{userProfile?.name}</p>
                    <p className="text-sm text-gray-400 capitalize">{userProfile?.role}</p>
                </div>
                <button
                    onClick={signOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-red-800/50 hover:text-white rounded-md transition-colors"
                >
                    <LogoutIcon className="h-6 w-6" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
