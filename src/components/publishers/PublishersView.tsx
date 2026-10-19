import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { canManageUsers } from '../../services/securityRules';
import { apiService } from '../../services/apiService';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { PublisherModal } from './PublisherModal';
import { PublisherCsvModal } from './PublisherCsvModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Users,
  Plus,
  Search,
  Edit2,
  KeyRound,
  Trash2,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react';
import { ServiceGroup } from '../../types';
import { GroupOverseersModal } from './GroupOverseersModal';

const ROLE_LABELS: Record<string, string> = {
  COORDINADOR: 'Coordinador',
  SUPERINTENDENTE_DE_SERVICIO: 'Superintendente Servicio',
  SECRETARIO: 'Secretario',
  ASISTENTE_SUPERINTENDENTE_SERVICIO: 'Asistente Superint.',
  ANCIANO: 'Anciano',
  SIERVO_MINISTERIAL: 'Siervo Ministerial',
  PRECURSOR_REGULAR: 'Precursor Regular',
  PRECURSOR_AUXILIAR: 'Precursor Auxiliar',
  PUBLICADOR: 'Publicador',
};

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'COORDINADOR':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'SUPERINTENDENTE_DE_SERVICIO':
    case 'ASISTENTE_SUPERINTENDENTE_SERVICIO':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'SECRETARIO':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'ANCIANO':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'SIERVO_MINISTERIAL':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'PRECURSOR_REGULAR':
    case 'PRECURSOR_AUXILIAR':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

interface PublishersViewProps {
  publishers: UserProfile[];
  congregationId?: string;
  serviceGroups?: ServiceGroup[];
  onReloadPublishers?: () => Promise<void>;
  onSavePublisher: (user: UserProfile) => Promise<void>;
  onDeletePublisher: (user: UserProfile) => Promise<void>;
  onSaveServiceGroup?: (group: any) => Promise<void>;
}

export const PublishersView: React.FC<PublishersViewProps> = ({
  publishers,
  congregationId,
  serviceGroups = [],
  onReloadPublishers,
  onSavePublisher,
  onDeletePublisher,
  onSaveServiceGroup,
}) => {
  const { currentUser } = useAuth();
  const isCoordinator = canManageUsers(currentUser?.role);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [importSuccessAlert, setImportSuccessAlert] = useState<string>('');
  const [editingItem, setEditingItem] = useState<UserProfile | null>(null);
  const [deletingItem, setDeletingItem] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extraer números de grupos disponibles
  const availableGroupNumbers = Array.from(
    new Set([1, 2, 3, 4, 5, 6, ...publishers.map((p) => p.serviceGroup || 1)])
  ).sort((a, b) => a - b);

  // Mapeo rápido de dirigentes/auxiliares por grupo
  const groupInfoMap = new Map(serviceGroups.map((g) => [g.groupNumber, g]));

  const filteredPublishers = publishers
    .filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        (p.address && p.address.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (groupFilter !== 'all') {
        const targetGroup = parseInt(groupFilter, 10);
        if ((p.serviceGroup || 1) !== targetGroup) return false;
      }

      if (roleFilter !== 'all') {
        const hasRole = p.role === roleFilter || (Array.isArray(p.roles) && p.roles.includes(roleFilter as any));
        const hasElder = roleFilter === 'ANCIANO' && p.isElder;
        const hasServant = roleFilter === 'SIERVO_MINISTERIAL' && p.isMinisterialServant;
        const hasPioneer = roleFilter === 'PRECURSOR_REGULAR' && p.isRegularPioneer;
        const hasAuxPioneer = roleFilter === 'PRECURSOR_AUXILIAR' && p.isAuxiliaryPioneer;
        return Boolean(hasRole || hasElder || hasServant || hasPioneer || hasAuxPioneer);
      }
      return true;
    })
    .sort((a, b) => {
      const gA = a.serviceGroup || 1;
      const gB = b.serviceGroup || 1;
      if (gA !== gB) return gA - gB;
      const lastCompare = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastCompare !== 0) return lastCompare;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingItem(user);
    setModalOpen(true);
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (!isCoordinator || user.id === currentUser?.id) return;
    await onSavePublisher({
      ...user,
      active: !user.active,
    });
  };

  const handleSendRecovery = async (user: UserProfile) => {
    const newPass = window.prompt(
      `Ingresa la nueva contraseña para ${user.fullName}:`,
      'password123'
    );
    if (!newPass) return;
    if (newPass.trim().length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    try {
      await apiService.adminResetPassword(user.id, newPass.trim());
      alert(`Contraseña actualizada con éxito para ${user.fullName}.\nNueva contraseña: ${newPass.trim()}`);
    } catch (e: any) {
      alert(`Error al actualizar contraseña: ${e.message}`);
    }
  };

  const handleDeletePublisher = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await onDeletePublisher(deletingItem);
      setDeletingItem(null);
    } catch (e: any) {
      alert(`Error eliminando publicador: ${e.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs text-slate-500 font-medium">Directorio y Permisos</span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Publicadores de la Congregación
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ordenados por grupos de servicio · Gestión de cuentas, roles y domicilios
          </p>
        </div>

        {isCoordinator && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsGroupsModalOpen(true)}
              className="text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 border-indigo-200"
            >
              <UserCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
              Dirigentes de Grupos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCsvModalOpen(true)}
              className="text-slate-700 bg-white hover:bg-slate-50 border-slate-300"
            >
              <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
              Importar CSV
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Registrar Publicador
            </Button>
          </div>
        )}
      </div>

      {importSuccessAlert && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {importSuccessAlert}</span>
          <button
            type="button"
            onClick={() => setImportSuccessAlert('')}
            className="text-emerald-700 hover:text-emerald-950 text-base font-bold leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Filtro por Grupo */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Grupo:</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
            >
              <option value="all">Todos los grupos</option>
              {availableGroupNumbers.map((num) => (
                <option key={num} value={num}>
                  Grupo {num}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Rol */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Rol:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="all">Todos los roles</option>
              <option value="COORDINADOR">Coordinador</option>
              <option value="SUPERINTENDENTE_DE_SERVICIO">Superintendente de Servicio</option>
              <option value="SECRETARIO">Secretario</option>
              <option value="ASISTENTE_SUPERINTENDENTE_SERVICIO">Asistente Superintendente</option>
              <option value="ANCIANO">Anciano</option>
              <option value="SIERVO_MINISTERIAL">Siervo Ministerial</option>
              <option value="PRECURSOR_REGULAR">Precursor Regular</option>
              <option value="PRECURSOR_AUXILIAR">Precursor Auxiliar</option>
              <option value="PUBLICADOR">Publicador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Publicadores */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                <th className="py-3 px-4">Grupo y Domicilio</th>
                <th className="py-3 px-4">Nombre y Correo</th>
                <th className="py-3 px-4">Rol / Nombramientos</th>
                <th className="py-3 px-4">Privilegios</th>
                <th className="py-3 px-4">Estado</th>
                {isCoordinator && <th className="py-3 px-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPublishers.map((user) => {
                const groupInfo = groupInfoMap.get(user.serviceGroup || 1);
                const isGroupOverseer = groupInfo?.overseerId === user.id;
                const isGroupAssistant = groupInfo?.assistantId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Columna Grupo y Domicilio */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Grupo {user.serviceGroup || 1}
                          </span>
                          {isGroupOverseer && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Dirigente
                            </span>
                          )}
                          {isGroupAssistant && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                              Auxiliar
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[10px] max-w-[200px] truncate block" title={user.address || 'Sin dirección registrada'}>
                          📍 {user.address || 'Sin dirección registrada'}
                        </span>
                      </div>
                    </td>

                    {/* Columna Nombre y Correo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {user.fullName}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {user.email}
                        </span>
                        {user.phoneNumber && (
                          <span className="text-slate-400 text-[10px] block font-mono">
                            {user.phoneNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Columna Rol */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadgeStyle(
                            user.role
                          )}`}
                          title="Rol principal que determina permisos en el sistema"
                        >
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          {ROLE_LABELS[user.role] || user.role}
                        </span>

                        {/* Otros roles o nombramientos */}
                        {user.roles && user.roles.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {user.roles
                              .filter((r) => r !== user.role)
                              .map((r) => (
                                <span
                                  key={r}
                                  className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200"
                                >
                                  {ROLE_LABELS[r] || r}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Columna Privilegios */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <span
                          className={
                            user.canLeadPreaching
                              ? 'text-slate-900 font-medium'
                              : 'text-slate-400'
                          }
                        >
                          {user.canLeadPreaching ? '✓ Dirige Salidas' : '— No dirige'}
                        </span>
                        <span
                          className={
                            user.canPublicPreaching
                              ? 'text-sky-800 font-medium'
                              : 'text-slate-400'
                          }
                        >
                          {user.canPublicPreaching ? '✓ Predicación Pública' : '— Sin carritos'}
                        </span>
                      </div>
                    </td>

                    {/* Columna Estado */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium ${
                          user.active ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {isCoordinator && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSendRecovery(user)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                            title="Enviar enlace para restablecer clave"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                            title="Editar perfil y permisos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {user.id !== currentUser?.id && !user.isMasterAdmin && (
                            <button
                              onClick={() => setDeletingItem(user)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                              title="Eliminar publicador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredPublishers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                    No se encontraron publicadores con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Asignación de Dirigentes y Auxiliares por Grupo */}
      {isGroupsModalOpen && (
        <GroupOverseersModal
          isOpen={isGroupsModalOpen}
          onClose={() => setIsGroupsModalOpen(false)}
          congregationId={congregationId || currentUser?.congregationId || ''}
          publishers={publishers}
          serviceGroups={serviceGroups}
          onSaved={async () => {
            if (onReloadPublishers) await onReloadPublishers();
          }}
        />
      )}

      {modalOpen && (
        <PublisherModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={onSavePublisher}
          initialData={editingItem}
          currentUserId={currentUser?.id}
        />
      )}
      {isCsvModalOpen && (
        <PublisherCsvModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          congregationId={congregationId || currentUser?.congregationId || ''}
          onImportSuccess={async (count: number) => {
            setImportSuccessAlert(`¡Se importaron ${count} publicadores exitosamente a la congregación!`);
            setTimeout(() => setImportSuccessAlert(''), 8000);
            if (onReloadPublishers) {
              await onReloadPublishers();
            }
          }}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeletePublisher}
        title="Eliminar publicador"
        message={`¿Seguro que deseas eliminar a ${deletingItem?.fullName}? También se eliminará su cuenta de acceso y no podrá iniciar sesión.`}
        confirmText="Eliminar"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  );
};
