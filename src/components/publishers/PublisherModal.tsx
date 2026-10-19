import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, computeHighestRole, ROLE_HIERARCHY } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShieldCheck, Award } from 'lucide-react';

interface PublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserProfile) => Promise<void>;
  initialData?: UserProfile | null;
  currentUserId?: string;
}

const ROLE_OPTIONS: { id: UserRole; label: string; desc: string; category: string }[] = [
  { id: 'COORDINADOR', label: 'Coordinador', desc: 'Coordinador del cuerpo de ancianos', category: 'Administración' },
  { id: 'SUPERINTENDENTE_DE_SERVICIO', label: 'Superintendente de Servicio', desc: 'Comité de servicio', category: 'Administración' },
  { id: 'SECRETARIO', label: 'Secretario', desc: 'Acceso de lectura a todas las cantidades y tarjetas', category: 'Administración' },
  { id: 'ASISTENTE_SUPERINTENDENTE_SERVICIO', label: 'Asistente Superintendente Servicio', desc: 'Apoyo operativo', category: 'Administración' },
  { id: 'ANCIANO', label: 'Anciano de Congregación', desc: 'Pastor y superintendente', category: 'Nombramiento' },
  { id: 'SIERVO_MINISTERIAL', label: 'Siervo Ministerial', desc: 'Ayudante ministerial', category: 'Nombramiento' },
  { id: 'PRECURSOR_REGULAR', label: 'Precursor Regular', desc: 'Tiempo completo', category: 'Precursorado' },
  { id: 'PRECURSOR_AUXILIAR', label: 'Precursor Auxiliar', desc: 'Precursorado temporal', category: 'Precursorado' },
  { id: 'PUBLICADOR', label: 'Publicador', desc: 'Rol base en la congregación', category: 'General' },
];

export const PublisherModal: React.FC<PublisherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserId,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceGroup, setServiceGroup] = useState<number>(1);
  const [address, setAddress] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['PUBLICADOR']);
  const [canLeadPreaching, setCanLeadPreaching] = useState(false);
  const [canPublicPreaching, setCanPublicPreaching] = useState(true);
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isSelf = initialData?.id === currentUserId;

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName);
      setLastName(initialData.lastName);
      setEmail(initialData.email);
      setPhoneNumber(initialData.phoneNumber || '');
      setServiceGroup(initialData.serviceGroup || 1);
      setAddress(initialData.address || '');

      let initialRoles: UserRole[] = (initialData.roles as UserRole[]) || [];
      if (!initialRoles.length) {
        initialRoles = [initialData.role || 'PUBLICADOR'];
      }
      if (initialData.isElder && !initialRoles.includes('ANCIANO')) {
        initialRoles.push('ANCIANO');
      }
      if (initialData.isMinisterialServant && !initialRoles.includes('SIERVO_MINISTERIAL')) {
        initialRoles.push('SIERVO_MINISTERIAL');
      }
      if (initialData.isRegularPioneer && !initialRoles.includes('PRECURSOR_REGULAR')) {
        initialRoles.push('PRECURSOR_REGULAR');
      }
      if (initialData.isAuxiliaryPioneer && !initialRoles.includes('PRECURSOR_AUXILIAR')) {
        initialRoles.push('PRECURSOR_AUXILIAR');
      }
      if (!initialRoles.includes('PUBLICADOR')) {
        initialRoles.push('PUBLICADOR');
      }
      setSelectedRoles(initialRoles);

      setCanLeadPreaching(initialData.canLeadPreaching);
      setCanPublicPreaching(initialData.canPublicPreaching);
      setActive(initialData.active);
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setServiceGroup(1);
      setAddress('');
      setSelectedRoles(['PUBLICADOR']);
      setCanLeadPreaching(false);
      setCanPublicPreaching(true);
      setActive(true);
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  const effectiveHighestRole = computeHighestRole(selectedRoles);

  const toggleRole = (roleId: UserRole) => {
    if (isSelf) return;

    setSelectedRoles((prev) => {
      let updated: UserRole[];
      if (prev.includes(roleId)) {
        updated = prev.filter((r) => r !== roleId);
        // Garantizar que siempre conserve al menos PUBLICADOR
        if (updated.length === 0) updated = ['PUBLICADOR'];
      } else {
        updated = [...prev, roleId];
        // Si se marca anciano, coordinador o superintendente, sugerir dirigir salidas
        if (['ANCIANO', 'COORDINADOR', 'SUPERINTENDENTE_DE_SERVICIO'].includes(roleId)) {
          setCanLeadPreaching(true);
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Nombre y apellido son obligatorios.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    const isElder =
      selectedRoles.includes('ANCIANO') ||
      selectedRoles.includes('COORDINADOR') ||
      selectedRoles.includes('SUPERINTENDENTE_DE_SERVICIO');
    const isServant =
      selectedRoles.includes('SIERVO_MINISTERIAL') ||
      selectedRoles.includes('ASISTENTE_SUPERINTENDENTE_SERVICIO');
    const isRegularPioneer = selectedRoles.includes('PRECURSOR_REGULAR');
    const isAuxiliaryPioneer = selectedRoles.includes('PRECURSOR_AUXILIAR');

    const user: UserProfile = {
      id: initialData?.id || '',
      congregationId: initialData?.congregationId || '',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim() || undefined,
      serviceGroup: Number(serviceGroup) || 1,
      address: address.trim() || undefined,
      role: effectiveHighestRole,
      roles: selectedRoles,
      isElder,
      isMinisterialServant: isServant,
      isRegularPioneer,
      isAuxiliaryPioneer,
      canLeadPreaching: canLeadPreaching || isElder,
      canPublicPreaching,
      active,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await onSave(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el publicador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Editar Miembro: ${initialData.fullName}` : 'Registrar Nuevo Publicador'}
      subtitle="Asignación de roles múltiples, privilegios y datos personales"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: Daniel"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Apellido <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: Rivera"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.org"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teléfono Móvil (Opcional)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+503 7123-4567"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Grupo de Servicio y Dirección */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Grupo de Servicio <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceGroup}
              onChange={(e) => setServiceGroup(parseInt(e.target.value, 10))}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <option key={num} value={num}>
                  Grupo {num}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Obligatorio para ordenación y asignación de dirigentes
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dirección de Domicilio <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Col. Las Flores, Calle 2, Casa #14"
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Requerida para emergencias y atención pastoral
            </span>
          </div>
        </div>

        {/* Panel de Rol Jerárquico Efectivo */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block">
                  Nombramiento
                </span>
                <span className="text-sm font-bold text-white">
                  {effectiveHighestRole.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono font-bold">
              Prioridad {ROLE_HIERARCHY[effectiveHighestRole]}
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Roles simultáneos asignados:</span>
            {selectedRoles.map((r) => (
              <span
                key={r}
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  r === effectiveHighestRole
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-white/10 text-slate-200'
                }`}
              >
                {r.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Asignación de Roles Múltiples */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-900">
              Asignación de Roles (Selecciona todos los que correspondan)
            </label>
            <span className="text-[11px] text-slate-400">
              Un anciano puede ser precursor y publicador
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {ROLE_OPTIONS.map((opt) => {
              const isChecked = selectedRoles.includes(opt.id);
              const isHighest = opt.id === effectiveHighestRole;
              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? isHighest
                        ? 'bg-indigo-50/80 border-indigo-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-800'
                      : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                  } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRole(opt.id)}
                    disabled={isSelf}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{opt.label}</span>
                      {isHighest && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-bold">
                          NOMBRAMIENTO
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          {isSelf && (
            <p className="text-[11px] text-amber-600 mt-1">
              Por seguridad, no puedes modificar tus propios roles.
            </p>
          )}
        </div>

        {/* Privilegios operativos adicionales */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-semibold text-slate-800 block mb-1">
            Privilegios Operativos de Servicio
          </span>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={canLeadPreaching}
              onChange={(e) => setCanLeadPreaching(e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
            />
            <span className="text-xs text-slate-700">
              Aprobado para <b>dirigir salidas de predicación</b> (Automático para ancianos)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={canPublicPreaching}
              onChange={(e) => setCanPublicPreaching(e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
            />
            <span className="text-xs text-slate-700">
              Aprobado para <b>predicación pública con carritos</b> (2-3 participantes)
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pub-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={isSelf}
            className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
          />
          <label htmlFor="pub-active" className="text-xs text-slate-700 font-medium">
            Cuenta activa en la congregación
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button size="sm" type="submit" isLoading={isSubmitting}>
            {initialData ? 'Actualizar Perfil' : 'Crear Cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
