import React, { useState, useRef, useEffect } from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { canManageUsers } from '../../services/securityRules';
import logo from '../../lib/logo.svg';
import {
  ChevronDown,
  CalendarDays,
  Map,
  MapPin,
  Share2,
  Calendar,
  FileSpreadsheet,
  BarChart3,
  Users,
  Building2,
  Settings,
  Shield,
  Database,
  Home,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  congregationName?: string;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  congregationName = 'Santa Tecla Norte',
  onOpenAuthModal,
}) => {
  const { currentUser, logout } = useAuth();
  const isPublisher = currentUser?.role === 'PUBLICADOR' && !currentUser?.isMasterAdmin;
  const [openDropdown, setOpenDropdown] = useState<'predicacion' | 'gestion' | 'admin' | null>(null);

  const navRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tab: ViewTab) => {
    onSelectTab(tab);
    setOpenDropdown(null);
  };

  const isPredicacionActive = [
    'programa',
    'territorios',
    'lugares',
    'publica',
    'calendario',
  ].includes(currentTab);

  const isGestionActive = ['s21_tarjetas', 'informes', 'publicadores'].includes(currentTab);

  const isAdminActive = [
    'datos_congregacion',
    'configuracion',
    'auditoria',
    'neon_consola',
  ].includes(currentTab);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between gap-6 px-4 sm:px-6 h-14 max-w-7xl mx-auto" ref={navRef}>
        {/* Zona 1: Brand wordmark & Inicio rápido */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSelectTab('inicio')}
            className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-slate-700 transition-colors"
          >
            <img src={logo} alt="Logotipo del sistema" className="w-7 h-7 rounded-lg shrink-0" />
            <span>Koinia</span>
          </button>
        </div>

        {/* Zona 2: Navegación principal con DROPDOWNS */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          {/* Botón Inicio */}
          <button
            onClick={() => handleSelectTab('inicio')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              currentTab === 'inicio'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          {/* DROPDOWN 1: PREDICACIÓN Y SUS CARACTERÍSTICAS */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === 'predicacion' ? null : 'predicacion')
              }
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                isPredicacionActive || openDropdown === 'predicacion'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span>Predicación</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === 'predicacion' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'predicacion' && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Módulo de Predicación
                </div>
                <button
                  onClick={() => handleSelectTab('programa')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'programa'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="font-medium">Salidas Semanales</div>
                    <div className="text-[10px] text-slate-400">Reuniones de predicación y conductores</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectTab('territorios')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'territorios'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Map className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-medium">Territorios y Mapas</div>
                    <div className="text-[10px] text-slate-400">Polígonos GPS, estados y avances</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectTab('lugares')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'lugares'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-medium">Lugares de Salida</div>
                    <div className="text-[10px] text-slate-400">Casas y puntos de reunión para salir</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectTab('publica')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'publica'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-medium">Predicación Pública (Carritos)</div>
                    <div className="text-[10px] text-slate-400">Puntos fijos y turnos reglamentados</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectTab('calendario')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'calendario'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Calendario de Salidas</div>
                    <div className="text-[10px] text-slate-400">Vista mensual y eventos del campo</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* DROPDOWN 2: GESTIÓN Y SUS CARACTERÍSTICAS */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === 'gestion' ? null : 'gestion')
              }
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                isGestionActive || openDropdown === 'gestion'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Gestión</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === 'gestion' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'gestion' && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Módulo Ministerial (S-21)
                </div>
                <button
                  onClick={() => handleSelectTab('s21_tarjetas')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 's21_tarjetas'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">Registro y Tarjetas S-21</div>
                    <div className="text-[10px] text-slate-400">Fichas S-21 mensuales, horas y cursos</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectTab('informes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'informes'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Informes y Totales Anuales</div>
                    <div className="text-[10px] text-slate-400">Resumen del año de servicio</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectTab('publicadores')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'publicadores'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4 text-violet-600" />
                  <div>
                    <div className="font-medium">Directorio de Publicadores</div>
                    <div className="text-[10px] text-slate-400">Grupos, nombramientos y privilegios</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* DROPDOWN 3: ADMINISTRACIÓN Y DATOS GENERALES DE LA CONGREGACIÓN */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === 'admin' ? null : 'admin')
              }
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                isAdminActive || openDropdown === 'admin'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Administración</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === 'admin' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'admin' && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Datos de la Congregación & Sistema
                </div>
                <button
                  onClick={() => handleSelectTab('datos_congregacion')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    currentTab === 'datos_congregacion'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="font-medium">Datos Generales y Salón</div>
                    <div className="text-[10px] text-slate-400">Horarios de reunión, circuito y dirección</div>
                  </div>
                </button>
                {!isPublisher && (
                  <>
                    <button
                      onClick={() => handleSelectTab('configuracion')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        currentTab === 'configuracion'
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-medium">Ajustes y Respaldos</div>
                        <div className="text-[10px] text-slate-400">Logo, copias de seguridad y preferencias</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTab('auditoria')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        currentTab === 'auditoria'
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="font-medium">Bitácora de Auditoría</div>
                        <div className="text-[10px] text-slate-400">Historial de cambios y seguridad</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSelectTab('neon_consola')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        currentTab === 'neon_consola'
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Database className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-medium">Monitor Neon PostgreSQL</div>
                        <div className="text-[10px] text-slate-400">Estado de conexión y tablas en la nube</div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </nav>

        {/* Zona 3: Contexto de Usuario / Sesión */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="text-right hidden sm:block">
                <span className="font-semibold text-slate-900 block leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentUser.role.replace(/_/g, ' ')} · {congregationName}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
