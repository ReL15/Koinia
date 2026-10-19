import React, { useState } from 'react';
import { ViewTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { canManageUsers, canManageCongregation, isPublisherOnly } from '../../services/securityRules';
import {
  Home,
  CalendarDays,
  Calendar,
  Map,
  MapPin,
  Share2,
  FileSpreadsheet,
  BarChart3,
  Users,
  Building2,
  Settings,
  Shield,
  Database,
  Plus,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  congregationName: string;
  timezone: string;
  onOpenNewCongregationModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  congregationName,
  timezone,
  onOpenNewCongregationModal,
}) => {
  const {
    currentUser,
    isMasterAdmin,
    availableCongregations,
    activeCongregationId,
    switchCongregation,
  } = useAuth();

  const isPublisher = isPublisherOnly(currentUser);

  const [expandedSections, setExpandedSections] = useState<{
    predicacion: boolean;
    gestion: boolean;
    admin: boolean;
  }>({
    predicacion: true,
    gestion: true,
    admin: true,
  });

  const toggleSection = (section: 'predicacion' | 'gestion' | 'admin') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const predicacionItems = [
    { id: 'programa' as ViewTab, label: 'Salidas Semanales', icon: CalendarDays },
    { id: 'territorios' as ViewTab, label: 'Territorios y Mapas', icon: Map },
    { id: 'lugares' as ViewTab, label: 'Lugares de Salida', icon: MapPin },
    { id: 'publica' as ViewTab, label: 'Predicación Pública', icon: Share2 },
    { id: 'calendario' as ViewTab, label: 'Calendario de Salidas', icon: Calendar },
  ];

  const gestionItems = [
    { id: 's21_tarjetas' as ViewTab, label: 'Tarjetas S-21', icon: FileSpreadsheet },
    { id: 'informes' as ViewTab, label: 'Informes y Totales', icon: BarChart3 },
    { id: 'publicadores' as ViewTab, label: 'Directorio de Publicadores', icon: Users },
  ];

  const adminItems = [
    { id: 'datos_congregacion' as ViewTab, label: 'Datos del Salón', icon: Building2 },
    ...(!isPublisher
      ? [
          { id: 'configuracion' as ViewTab, label: 'Ajustes y Respaldos', icon: Settings },
          { id: 'auditoria' as ViewTab, label: 'Bitácora de Auditoría', icon: Shield },
          { id: 'neon_consola' as ViewTab, label: 'Monitor Neon PostgreSQL', icon: Database },
        ]
      : []),
  ];

  return (
    <aside
      aria-label="Barra lateral de navegación"
      className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14"
    >
      {/* Contexto de la Congregación */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isMasterAdmin ? 'Congregación Activa' : 'Congregación'}
          </span>
          {isMasterAdmin && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
              Maestro
            </span>
          )}
        </div>

        {isMasterAdmin ? (
          <div className="mt-1.5 space-y-1.5">
            <select
              value={activeCongregationId}
              onChange={(e) => switchCongregation(e.target.value)}
              className="w-full px-2 py-1 text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 truncate shadow-2xs"
            >
              {availableCongregations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono truncate">{timezone}</span>
              {onOpenNewCongregationModal && (
                <button
                  onClick={onOpenNewCongregationModal}
                  className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Nueva
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {congregationName}
            </h2>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5 font-mono">
              {timezone}
            </span>
          </>
        )}
      </div>

      {/* Enlaces de navegación con acordeones/dropdowns verticales */}
      <nav aria-label="Menú principal" className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
        {/* Inicio directo */}
        <button
          onClick={() => onSelectTab('inicio')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
            currentTab === 'inicio'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Panel de Inicio</span>
        </button>

        {/* Portal del Publicador (Solo visible para publicadores) */}
        {isPublisher && (
          <button
            onClick={() => onSelectTab('mi_congregacion')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
              currentTab === 'mi_congregacion'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Mi Salón y Grupo</span>
          </button>
        )}

        {/* 1. SECCIÓN PREDICACIÓN */}
        <div>
          <button
            onClick={() => toggleSection('predicacion')}
            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Predicación
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                expandedSections.predicacion ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.predicacion && (
            <div className="mt-1 space-y-0.5 pl-1">
              {predicacionItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. SECCIÓN GESTIÓN MINISTERIAL (Oculta para publicadores) */}
        {!isPublisher && (
          <div>
            <button
              onClick={() => toggleSection('gestion')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Gestión Ministerial
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.gestion ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.gestion && (
              <div className="mt-1 space-y-0.5 pl-1">
                {gestionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. SECCIÓN ADMINISTRACIÓN Y CONGREGACIÓN (Oculta para publicadores) */}
        {!isPublisher && (
          <div>
            <button
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Administración
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedSections.admin ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.admin && (
              <div className="mt-1 space-y-0.5 pl-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Pie del sidebar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-800 block truncate">
              {currentUser?.fullName}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {currentUser?.role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
