import React, { useState } from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { canManageUsers, canManageCongregation, isPublisherOnly } from '../../services/securityRules';
import {
  Home,
  CalendarDays,
  Calendar,
  MoreHorizontal,
  Map,
  MapPin,
  Users,
  Settings,
  Share2,
  Building2,
  X,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, isMasterAdmin } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isPublisher = isPublisherOnly(currentUser);
  const canAdminUsers = (canManageUsers(currentUser?.role) || isMasterAdmin) && !isPublisher;
  const canAdminCong = (canManageCongregation(currentUser?.role) || isMasterAdmin) && !isPublisher;

  const handleSelect = (tab: ViewTab) => {
    onSelectTab(tab);
    setIsMoreOpen(false);
  };

  const isMoreTabActive = ['territorios', 'lugares', 'publica', 'publicadores', 'configuracion'].includes(
    currentTab
  );

  return (
    <>
      {/* Barra de navegación fija inferior para móviles */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 pb-safe"
      >
        <div className="grid grid-cols-4 h-full">
          <button
            onClick={() => handleSelect('inicio')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              currentTab === 'inicio' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Inicio</span>
          </button>

          <button
            onClick={() => handleSelect('programa')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              currentTab === 'programa' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Programa</span>
          </button>

          <button
            onClick={() => handleSelect('calendario')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              currentTab === 'calendario' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Calendario</span>
          </button>

          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              isMoreTabActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Más</span>
          </button>
        </div>
      </nav>

      {/* Drawer / Hoja inferior para menú "Más" */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-5 z-10 max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Más Secciones</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => handleSelect('territorios')}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                  currentTab === 'territorios'
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Map className="w-5 h-5 text-slate-500" />
                <div>
                  <span className="block font-medium">Territorios</span>
                  <span className="text-xs text-slate-500">
                    Límites en mapa, avance y asignaciones
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleSelect('lugares')}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                  currentTab === 'lugares'
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-5 h-5 text-slate-500" />
                <div>
                  <span className="block font-medium">Lugares de Salida</span>
                  <span className="text-xs text-slate-500">
                    Puntos habituales de reunión
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleSelect('publica')}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                  currentTab === 'publica'
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Share2 className="w-5 h-5 text-slate-500" />
                <div>
                  <span className="block font-medium">Predicación Pública</span>
                  <span className="text-xs text-slate-500">
                    Puntos de carritos y turnos (2-3 personas)
                  </span>
                </div>
              </button>

              {!isPublisher && (
                <>
                  <button
                    onClick={() => handleSelect('s21_tarjetas')}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                      currentTab === 's21_tarjetas'
                        ? 'bg-emerald-50 text-emerald-800 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                      S21
                    </div>
                    <div>
                      <span className="block font-medium">Registro y Tarjetas S-21</span>
                      <span className="text-xs text-slate-500">
                        Fichas individuales de publicador
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelect('informes')}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                      currentTab === 'informes'
                        ? 'bg-blue-50 text-blue-800 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                      INF
                    </div>
                    <div>
                      <span className="block font-medium">Informes y Totales Anuales</span>
                      <span className="text-xs text-slate-500">
                        Resumen mensual del año de servicio
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelect('datos_congregacion')}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                      currentTab === 'datos_congregacion'
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                      SAL
                    </div>
                    <div>
                      <span className="block font-medium">Datos del Salón del Reino</span>
                      <span className="text-xs text-slate-500">
                        Dirección, GPS y horarios de reunión
                      </span>
                    </div>
                  </button>
                </>
              )}

              {canAdminUsers && (
                <button
                  onClick={() => handleSelect('publicadores')}
                  className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                    currentTab === 'publicadores'
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="block font-medium">Directorio de Publicadores</span>
                    <span className="text-xs text-slate-500">
                      Administración de miembros y privilegios
                    </span>
                  </div>
                </button>
              )}

              {canAdminCong && (
                <button
                  onClick={() => handleSelect('configuracion')}
                  className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-left text-sm transition-colors ${
                    currentTab === 'configuracion'
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-5 h-5 text-slate-500" />
                  <div>
                    <span className="block font-medium">Ajustes y Respaldo</span>
                    <span className="text-xs text-slate-500">
                      Zona horaria, respaldo JSON y auditoría
                    </span>
                  </div>
                </button>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
