import { lazy, Suspense, useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Toaster } from './components/ui/sonner';

type Page = 'landing' | 'menu' | 'chef' | 'admin';

const MenuPage = lazy(() =>
  import('./components/menu/MenuPage').then((module) => ({ default: module.MenuPage }))
);
const ChefPanel = lazy(() =>
  import('./components/ChefPanel').then((module) => ({ default: module.ChefPanel }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [tableNumber, setTableNumber] = useState<number | undefined>();

  // Check URL params for table number (QR code scanning)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) {
      setTableNumber(parseInt(table));
      setCurrentPage('menu');
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={(page) => setCurrentPage(page)} />;
      case 'menu':
        return <MenuPage tableNumber={tableNumber} />;
      case 'chef':
        return <ChefPanel onBack={() => setCurrentPage('landing')} />;
      case 'admin':
        return <AdminDashboard onBack={() => setCurrentPage('landing')} />;
      default:
        return <LandingPage onNavigate={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
          </div>
        }
      >
        {renderPage()}
      </Suspense>
      <Toaster position="top-center" richColors />
    </>
  );
}
