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

type Page = 'dashboard' | 'deliveries' | 'purchases' | 'reports' | 'employees';

const SupabaseConfigError: React.FC = () => (
  <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-4">
    <div className="max-w-lg text-center space-y-4">
      <h1 className="text-2xl font-bold text-red-400">Supabase is not configured</h1>
      <p className="text-sm text-gray-300">
        Your Supabase URL or Anon Key is still using the placeholder values.
        Open <code className="px-1 py-0.5 rounded bg-gray-800">services/supabase.ts</code> 
        and paste your project credentials from the Supabase dashboard.
      </p>
      <a
        href="https://supabase.com/dashboard/projects"
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
          <span className="text-sm text-gray-300">Loading...</span>
        </div>
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
        return <Employees />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userProfile={userProfile}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
