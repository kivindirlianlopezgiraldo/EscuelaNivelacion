// ============================================
// APP PRINCIPAL - ESCUELA DE NIVELACIÓN
// ============================================

import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store';
import { initializeDatabase } from '@/db/database';
import { Login } from '@/pages/Login';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Students } from '@/pages/Students';
import { Courses } from '@/pages/Courses';
import { Grades } from '@/pages/Grades';
import { Attendance } from '@/pages/Attendance';
import { Chat } from '@/pages/Chat';
import { Games } from '@/pages/Games';
import { useAuth } from '@/hooks';
import { Loader2 } from 'lucide-react';

// Páginas adicionales (placeholders para futura implementación)
function Teachers() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profesores</h1>
      <p className="text-muted-foreground">Gestión de profesores - En desarrollo</p>
    </div>
  );
}

function Parents() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Acudientes</h1>
      <p className="text-muted-foreground">Gestión de acudientes - En desarrollo</p>
    </div>
  );
}

function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reportes</h1>
      <p className="text-muted-foreground">Generación de reportes - En desarrollo</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>
      <p className="text-muted-foreground">Configuración del sistema - En desarrollo</p>
    </div>
  );
}

// Componente de carga
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg font-medium">Cargando...</p>
      </div>
    </div>
  );
}

// Router simple basado en estado
function Router() {
  const { currentPage } = useUIStore();
  const { hasRole } = useAuth();

  const pages: Record<string, React.ComponentType> = {
    dashboard: Dashboard,
    students: Students,
    teachers: Teachers,
    parents: Parents,
    courses: Courses,
    grades: Grades,
    attendance: Attendance,
    chat: Chat,
    games: Games,
    reports: Reports,
    settings: Settings
  };

  const PageComponent = pages[currentPage] || Dashboard;

  // Verificar permisos de acceso
  const restrictedPages: Record<string, ('admin' | 'teacher' | 'student' | 'parent')[]> = {
    students: ['admin', 'teacher'],
    teachers: ['admin'],
    parents: ['admin'],
    games: ['student'],
    settings: ['admin']
  };

  if (restrictedPages[currentPage] && !hasRole(restrictedPages[currentPage])) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

  return <PageComponent />;
}

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      setDbInitialized(true);
    };
    init();
  }, []);

  if (!dbInitialized || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

export default App;
