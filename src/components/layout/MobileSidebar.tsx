import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Upload,
  FileText,
  TrendingUp,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  Brain,
  Sliders,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  adminOnly?: boolean;
}

const userNavItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Subir Reunión', icon: Upload, path: '/upload' },
  { title: 'Mis Evaluaciones', icon: FileText, path: '/evaluations' },
  { title: 'Progreso', icon: TrendingUp, path: '/progress' },
  { title: 'Configuración', icon: Settings, path: '/settings' },
];

const adminNavItems: NavItem[] = [
  { title: 'Dashboard Admin', icon: BarChart3, path: '/admin', adminOnly: true },
  { title: 'Usuarios', icon: Users, path: '/admin/users', adminOnly: true },
  { title: 'Feedback Global', icon: MessageSquare, path: '/admin/feedback', adminOnly: true },
  { title: 'Entrenar Feedback', icon: Sliders, path: '/admin/config', adminOnly: true },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileSidebar = ({ open, onOpenChange }: MobileSidebarProps) => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <NavLink
        to={item.path}
        onClick={() => onOpenChange(false)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
          !isActive && 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
        )}
      >
        <Icon className={cn(
          'h-5 w-5 shrink-0',
          isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70'
        )} />
        <span className="font-medium">{item.title}</span>
      </NavLink>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Brain className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">
                Evaluador AI
              </h1>
              <p className="text-xs text-sidebar-foreground/60 font-normal">
                Feedback inteligente
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* User items */}
          <div className="space-y-1">
            {userNavItems.map((item) => (
              <NavItemComponent key={item.path} item={item} />
            ))}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Administración
                </p>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => (
                  <NavItemComponent key={item.path} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
