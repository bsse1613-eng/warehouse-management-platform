
import React from 'react';
import { useAuth } from './hooks/useAuth';
import { isSupabaseConfigured } from './services/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Deliveries from './components/Deliveries';
import Purchases from './components/Purchases';
import Reports from './components/Reports';
import Employees from './components/Employees';
import Sidebar from './components/Sidebar';
import { UserProfile } from './types';

type Page = 'dashboard' | 'deliveries' | 'purchases' | 'reports' | 'employees';

const SupabaseConfigError: React.FC = () => (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl text-center border border-red-500/50">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Configuration Error</h1>
            <p className="text-lg mb-2 text-gray-300">Your Supabase client is not configured.</p>
            <p className="text-gray-400 mb-6">
                Please open the <code className="bg-gray-700 p-1 rounded text-yellow-400">services/supabase.ts</code> file and replace the placeholder values for <code className="bg-gray-700 p-1 rounded text-yellow-400">supabaseUrl</code> and <code className="bg-gray-700 p-1 rounded text-yellow-400">supabaseAnonKey</code> with your credentials.
            </p>
            <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                Go to your Supabase Dashboard
            </a>
        </div>
    </div>
);

const App: React.FC = () => {
    const { session, userProfile, loading } = useAuth();
    const [currentPage, setCurrentPage] = React.useState<Page>('dashboard');

    if (!isSupabaseConfigured) {
        return <SupabaseConfigError />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (!session) {
        return <Login />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'deliveries':
                return <Deliveries />;
            case 'purchases':
                return <Purchases />;
            case 'reports':
                return <Reports />;
            case 'employees':
                return userProfile?.role === 'owner' ? <Employees /> : <div className="p-8 text-red-500">Access Denied</div>;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} userProfile={userProfile} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
