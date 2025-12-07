import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Bell, Shield } from 'lucide-react';

export const SettingsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    evaluations: true,
    progress: false,
  });

  const handleSave = () => {
    toast({
      title: 'Configuración guardada',
      description: 'Tus preferencias han sido actualizadas',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu cuenta y preferencias
        </p>
      </div>

      {/* Profile section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Información del perfil
        </h2>
        
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                defaultValue={profile?.nombre}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  defaultValue={profile?.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Para cambiar tu información de perfil, contacta al administrador.
          </p>
        </div>
      </div>

      {/* Security section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Seguridad
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Contraseña</p>
              <p className="text-sm text-muted-foreground">
                Última actualización: hace 30 días
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              Cambiar
            </Button>
          </div>
          
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sesión activa</p>
                <p className="text-sm text-muted-foreground">
                  Se cierra automáticamente tras 30 minutos de inactividad
                </p>
              </div>
              <span className="text-sm text-accent font-medium">Activa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notificaciones
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Notificaciones por email</p>
              <p className="text-sm text-muted-foreground">
                Recibe actualizaciones en tu correo
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, email: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Evaluaciones completadas</p>
              <p className="text-sm text-muted-foreground">
                Notificar cuando una evaluación esté lista
              </p>
            </div>
            <Switch
              checked={notifications.evaluations}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, evaluations: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Reportes de progreso</p>
              <p className="text-sm text-muted-foreground">
                Recibe resúmenes semanales de tu progreso
              </p>
            </div>
            <Switch
              checked={notifications.progress}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, progress: checked }))
              }
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
