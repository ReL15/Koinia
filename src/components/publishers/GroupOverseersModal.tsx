import React, { useState } from 'react';
import { UserProfile, ServiceGroup } from '../../types';
import { apiService } from '../../services/apiService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Users, UserCheck, ShieldCheck, Check, Save } from 'lucide-react';

interface GroupOverseersModalProps {
  isOpen: boolean;
  onClose: () => void;
  congregationId: string;
  publishers: UserProfile[];
  serviceGroups: ServiceGroup[];
  onSaved: () => Promise<void>;
}

export const GroupOverseersModal: React.FC<GroupOverseersModalProps> = ({
  isOpen,
  onClose,
  congregationId,
  publishers,
  serviceGroups,
  onSaved,
}) => {
  // Número de grupos que manejaremos (1 al 8 por defecto, o más si existen)
  const maxGroupInPublishers = Math.max(1, ...publishers.map((p) => p.serviceGroup || 1), ...serviceGroups.map((g) => g.groupNumber));
  const groupCount = Math.max(6, maxGroupInPublishers);
  const groupNumbers = Array.from({ length: groupCount }, (_, i) => i + 1);

  // Inicializar estado local con los datos existentes
  const initialDataMap: Record<number, { overseerId: string; assistantId: string; meetingPlace: string }> = {};
  groupNumbers.forEach((num) => {
    const existing = serviceGroups.find((g) => g.groupNumber === num);
    initialDataMap[num] = {
      overseerId: existing?.overseerId || '',
      assistantId: existing?.assistantId || '',
      meetingPlace: existing?.meetingPlace || '',
    };
  });

  const [formData, setFormData] = useState(initialDataMap);
  const [savingGroup, setSavingGroup] = useState<number | null>(null);
  const [successGroup, setSuccessGroup] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Hermanos que pueden dirigir salidas o tienen nombramiento (ancianos/siervos), aunque listamos todos los publicadores ordenados
  const candidateBrothers = [...publishers].sort((a, b) => a.fullName.localeCompare(b.fullName));

  const handleFieldChange = (
    groupNum: number,
    field: 'overseerId' | 'assistantId' | 'meetingPlace',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [groupNum]: {
        ...prev[groupNum],
        [field]: value,
      },
    }));
  };

  const handleSaveGroup = async (groupNum: number) => {
    const groupData = formData[groupNum];
    if (!groupData) return;

    setSavingGroup(groupNum);
    setErrorMsg('');
    try {
      await apiService.saveServiceGroup({
        congregationId,
        groupNumber: groupNum,
        name: `Grupo ${groupNum}`,
        overseerId: groupData.overseerId || undefined,
        assistantId: groupData.assistantId || undefined,
        meetingPlace: groupData.meetingPlace || undefined,
      });

      setSuccessGroup(groupNum);
      setTimeout(() => setSuccessGroup(null), 3000);
      await onSaved();
    } catch (err: any) {
      console.error('Error guardando dirigente de grupo:', err);
      setErrorMsg(err.message || 'Error al guardar dirigente de grupo');
    } finally {
      setSavingGroup(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignación de Dirigentes y Auxiliares de Grupo"
      subtitle="Establece quién dirige y asiste cada grupo de servicio en la congregación"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong>Requisito Teocrática de Permisos:</strong> Los hermanos asignados como dirigentes o auxiliares de grupo sólo podrán visualizar la actividad y tarjetas S-21 de los publicadores pertenecientes a su grupo asignado, a menos que cuenten con el rol de <em>Secretario</em>, <em>Superintendente de Servicio</em> o <em>Coordinador</em>.
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {groupNumbers.map((num) => {
            const data = formData[num] || { overseerId: '', assistantId: '', meetingPlace: '' };
            const publishersInGroup = publishers.filter((p) => (p.serviceGroup || 1) === num);
            const isSaving = savingGroup === num;
            const isSuccess = successGroup === num;

            return (
              <div
                key={num}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {num}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Grupo de Servicio {num}
                      </h3>
                      <span className="text-[10px] text-slate-500">
                        {publishersInGroup.length} {publishersInGroup.length === 1 ? 'publicador asignado' : 'publicadores asignados'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveGroup(num)}
                    disabled={isSaving}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                    }`}
                  >
                    {isSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Guardado
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Guardando...' : 'Guardar Grupo'}
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dirigente del Grupo */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hermano Dirigente (Encargado)
                    </label>
                    <select
                      value={data.overseerId}
                      onChange={(e) => handleFieldChange(num, 'overseerId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">-- Sin asignar --</option>
                      {candidateBrothers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.role.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auxiliar del Grupo */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hermano Auxiliar (Ayudante)
                    </label>
                    <select
                      value={data.assistantId}
                      onChange={(e) => handleFieldChange(num, 'assistantId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">-- Sin asignar --</option>
                      {candidateBrothers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.role.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lugar de reunión de grupo */}
                <div className="mt-2.5">
                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                    Punto de salida o domicilio habitual del grupo (Opcional):
                  </label>
                  <input
                    type="text"
                    value={data.meetingPlace}
                    onChange={(e) => handleFieldChange(num, 'meetingPlace', e.target.value)}
                    placeholder="Ej: Casa del hermano X o Salón del Reino"
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar Ventana
          </Button>
        </div>
      </div>
    </Modal>
  );
};
