// ============================================
// SIDEBAR DE NAVEGACIÓN
// ============================================

import { useAuthStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  MessageSquare,
  Gamepad2,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
  UserCircle,
  ClipboardList
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: ('admin' | 'teacher' | 'student' | 'parent')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: 'dashboard', roles: ['admin', 'teacher', 'student', 'parent'] },
  { label: 'Estudiantes', icon: Users, href: 'students', roles: ['admin', 'teacher'] },
  { label: 'Profesores', icon: UserCircle, href: 'teachers', roles: ['admin'] },
  { label: 'Acudientes', icon: Users, href: 'parents', roles: ['admin'] },
  { label: 'Cursos', icon: BookOpen, href: 'courses', roles: ['admin', 'teacher', 'student'] },
  { label: 'Calificaciones', icon: GraduationCap, href: 'grades', roles: ['admin', 'teacher', 'student', 'parent'] },
  { label: 'Asistencia', icon: Calendar, href: 'attendance', roles: ['admin', 'teacher', 'student', 'parent'] },
  { label: 'Chat', icon: MessageSquare, href: 'chat', roles: ['admin', 'teacher', 'student', 'parent'] },
  { label: 'Juegos', icon: Gamepad2, href: 'games', roles: ['student'] },
  { label: 'Reportes', icon: ClipboardList, href: 'reports', roles: ['admin', 'teacher', 'parent'] },
  { label: 'Configuración', icon: Settings, href: 'settings', roles: ['admin'] },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar, currentPage, setCurrentPage } = useUIStore();

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className={cn('flex items-center gap-2', !sidebarOpen && 'justify-center w-full')}>
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg truncate">Escuela Nivelación</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href;

              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    !sidebarOpen && 'justify-center px-2'
                  )}
                  onClick={() => setCurrentPage(item.href)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info */}
        <div className="border-t p-4">
          <div className={cn(
            'flex items-center gap-3',
            !sidebarOpen && 'justify-center'
          )}>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role === 'admin' && 'Administrador'}
                  {user?.role === 'teacher' && 'Profesor'}
                  {user?.role === 'student' && 'Estudiante'}
                  {user?.role === 'parent' && 'Acudiente'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
