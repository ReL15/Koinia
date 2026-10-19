import React, { useState } from 'react';
import { UserProfile, Congregation, ServiceGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { canViewAllGroupsActivity, canEditReports, isSecretary } from '../../services/securityRules';
import { S21CardModal } from './S21CardModal';
import { S21ReportFormModal } from './S21ReportFormModal';
import { FileSpreadsheet, Search, Filter, ShieldCheck, PlusCircle, AlertCircle } from 'lucide-react';

interface S21ViewProps {
  congregation: Congregation;
  publishers: UserProfile[];
  serviceGroups?: ServiceGroup[];
}

export const S21View: React.FC<S21ViewProps> = ({ congregation, publishers, serviceGroups = [] }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [selectedPublisher, setSelectedPublisher] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [reportingPublisher, setReportingPublisher] = useState<UserProfile | null>(null);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);

  const canViewAll = canViewAllGroupsActivity(currentUser);
  const canEdit = canEditReports(currentUser);
  const userIsSecretary = isSecretary(currentUser);

  // Grupos dirigidos o asistidos por el usuario actual
  const myDirectedGroups = serviceGroups
    .filter((g) => g.overseerId === currentUser?.id || g.assistantId === currentUser?.id)
    .map((g) => g.groupNumber);

  // Lista de grupos disponibles para el filtro
  const availableGroups = Array.from(
    new Set([1, 2, 3, 4, ...publishers.map((p) => p.serviceGroup || 1)])
  ).sort((a, b) => a - b);

  // Filtrado y Aislamiento Estricto por Grupo
  const filteredPublishers = publishers
    .filter((p) => {
      // 1. Regla de Permisos por Grupo: Si no es admin/secretario, solo ve su(s) grupo(s) asignado(s)
      if (!canViewAll) {
        if (myDirectedGroups.length === 0) return false;
        if (!myDirectedGroups.includes(p.serviceGroup || 1)) return false;
      }

      // 2. Filtro interactivo de grupo
      if (groupFilter !== 'all') {
        if ((p.serviceGroup || 1) !== parseInt(groupFilter, 10)) return false;
      }

      // 3. Búsqueda por texto (nombre, correo, teléfono o dirección)
      const term = searchTerm.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.phoneNumber && p.phoneNumber.includes(term)) ||
        (p.address && p.address.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      // ORDENAR POR GRUPO DE SERVICIO
      const gA = a.serviceGroup || 1;
      const gB = b.serviceGroup || 1;
      if (gA !== gB) return gA - gB;
      const lastA = a.lastName || '';
      const lastB = b.lastName || '';
      return lastA.localeCompare(lastB) || a.firstName.localeCompare(b.firstName);
    });

  const handleOpenCard = (pub: UserProfile) => {
    setSelectedPublisher(pub);
    setIsModalOpen(true);
  };

  const handleOpenReportForm = (pub: UserProfile) => {
    if (!canEdit) return;
    setReportingPublisher(pub);
    setIsReportFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo S-21 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                Registro de Publicadores · Tarjetas S-21
              </h1>
              {userIsSecretary && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Modo Secretario (Solo Lectura)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Edición 11/23 · {congregation.name} · Ordenado por Grupos de Servicio
            </p>
          </div>
        </div>

        {/* Buscador y Filtro de Grupo */}
        <div className="flex flex-wrap items-center gap-2">
          {canViewAll && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Grupo:</span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Todos los grupos</option>
                {availableGroups.map((num) => (
                  <option key={num} value={num}>
                    Grupo {num}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar publicador o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Alerta de Aislamiento si es dirigente de grupo */}
      {!canViewAll && myDirectedGroups.length > 0 && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Mostrando exclusivamente publicadores asignados a tu grupo de predicación (
            <strong>Grupo {myDirectedGroups.join(', ')}</strong>). No tienes visibilidad sobre otros grupos.
          </span>
        </div>
      )}

      {/* Alerta si es Secretario */}
      {userIsSecretary && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Privilegio de Secretario:</strong> Tienes acceso de consulta a todas las cantidades y registros S-21 de la congregación, pero la edición de informes está deshabilitada.
          </span>
        </div>
      )}

      {/* Lista de Publicadores con botón S-21 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700">
            Publicadores Visibles ({filteredPublishers.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Haz clic en "Ver Tarjeta S-21" para consultar los registros mensuales
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPublishers.map((pub) => (
            <div
              key={pub.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 leading-none">Grp</span>
                  <span className="text-xs font-extrabold text-indigo-700 leading-none mt-0.5">
                    {pub.serviceGroup || 1}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {pub.fullName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      {pub.role.replace(/_/g, ' ')}
                    </span>
                    {pub.roles &&
                      pub.roles.length > 1 &&
                      pub.roles
                        .filter((r) => r !== pub.role)
                        .map((r) => (
                          <span
                            key={r}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-slate-50 text-slate-600 border border-slate-200"
                          >
                            {r.replace(/_/g, ' ')}
                          </span>
                        ))}
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{pub.email}</span>
                    {pub.phoneNumber && <span>· {pub.phoneNumber}</span>}
                    {pub.address && (
                      <span className="text-slate-400 text-[10px]">
                        · 📍 {pub.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canEdit && (
                  <button
                    onClick={() => handleOpenReportForm(pub)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Registrar informe mensual para este publicador"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                    Registrar Informe
                  </button>
                )}

                <button
                  onClick={() => handleOpenCard(pub)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Ver Tarjeta S-21
                </button>
              </div>
            </div>
          ))}

          {filteredPublishers.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-400">
              {!canViewAll && myDirectedGroups.length === 0 ? (
                <div className="max-w-md mx-auto space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-semibold text-slate-700">Acceso restringido a Tarjetas S-21</p>
                  <p>
                    No estás asignado como Dirigente ni Auxiliar de un grupo de servicio. Únicamente los hermanos asignados a la dirección de grupos o los miembros de secretaría y supervisión pueden consultar esta sección.
                  </p>
                </div>
              ) : (
                'No se encontraron publicadores para el criterio de búsqueda seleccionado.'
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ficha S-21 (Con opción de Solo Lectura para Secretario) */}
      {isModalOpen && selectedPublisher && (
        <S21CardModal
          publisher={selectedPublisher}
          congregationName={congregation.name}
          readOnly={!canEdit}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Modal de Entrada de Informe Mensual (Solo si puede editar) */}
      {canEdit && isReportFormOpen && reportingPublisher && (
        <S21ReportFormModal
          isOpen={isReportFormOpen}
          onClose={() => {
            setIsReportFormOpen(false);
            setReportingPublisher(null);
          }}
          publisher={reportingPublisher}
          onSaved={() => {
            // Actualización
          }}
        />
      )}
    </div>
  );
};
