import { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
];

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.rol === 'admin';
  const allItems = isAdmin ? [...userNavItems, ...adminNavItems] : userNavItems;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-sidebar-accent group',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary',
          !isActive && 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
        )}
      >
        <Icon className={cn(
          'h-5 w-5 shrink-0 transition-colors',
          isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
        )} />
        {!collapsed && (
          <span className="font-medium truncate">{item.title}</span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
            <Brain className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">
                Evaluador AI
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Feedback inteligente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
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
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Administración
                </p>
              )}
              {collapsed && <div className="border-t border-sidebar-border my-2" />}
            </div>
            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavItemComponent key={item.path} item={item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            !collapsed && 'justify-start'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};
