import React, { useState, useEffect } from 'react';
import { UserProfile, S21Record } from '../../types';
import { apiService } from '../../services/apiService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { UserCheck, Calendar, BookOpen, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface S21ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisher: UserProfile;
  initialServiceYear?: string;
  initialMonthNumber?: number;
  initialRecord?: Partial<S21Record> | null;
  onSaved: () => void;
}

const MONTH_NAMES: { [key: number]: string } = {
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
};

export const S21ReportFormModal: React.FC<S21ReportFormModalProps> = ({
  isOpen,
  onClose,
  publisher,
  initialServiceYear = '2026-2027',
  initialMonthNumber = 9,
  initialRecord,
  onSaved,
}) => {
  const [serviceYear, setServiceYear] = useState<string>(initialServiceYear);
  const [monthNumber, setMonthNumber] = useState<number>(initialMonthNumber);

  // Estados según requerimiento del usuario:
  // "si la pestaña 'Participó' está checada, no sale lo de precursor ni lo de las horas...
  // pero si precursor está activado, se desactiva el de participó y se pone para que ponga horas, estudios y observaciones"
  const [participated, setParticipated] = useState<boolean>(true);
  const [isPioneer, setIsPioneer] = useState<boolean>(false);
  const [hours, setHours] = useState<string>('');
  const [bibleCourses, setBibleCourses] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (initialRecord) {
      if (initialRecord.service_year) setServiceYear(initialRecord.service_year);
      if (initialRecord.month_number) setMonthNumber(initialRecord.month_number);
      const isAux = Boolean(initialRecord.auxiliary_pioneer);
      setIsPioneer(isAux);
      if (isAux) {
        setParticipated(false);
        setHours(initialRecord.hours != null ? String(initialRecord.hours) : '');
      } else {
        setParticipated(Boolean(initialRecord.shared_in_ministry));
        setHours('');
      }
      setBibleCourses(initialRecord.bible_courses ?? 0);
      setNotes(initialRecord.notes || '');
    } else {
      // Default: Publicador normal que participó
      const isPioneerProfile = Boolean(publisher.isRegularPioneer || publisher.isAuxiliaryPioneer);
      if (isPioneerProfile) {
        setIsPioneer(true);
        setParticipated(false);
      } else {
        setParticipated(true);
        setIsPioneer(false);
      }
      setHours('');
      setBibleCourses(0);
      setNotes('');
    }
  }, [initialRecord, publisher, isOpen]);

  // Manejador cuando se cambia la casilla 'Participó en la predicación'
  const handleParticipatedChange = (checked: boolean) => {
    setParticipated(checked);
    if (checked) {
      setIsPioneer(false);
      setHours('');
    }
  };

  // Manejador cuando se activa 'Precursor'
  const handlePioneerChange = (checked: boolean) => {
    setIsPioneer(checked);
    if (checked) {
      setParticipated(false);
    }
  };

  const currentCalendarYear =
    monthNumber >= 9
      ? parseInt(serviceYear.split('-')[0], 10)
      : parseInt(serviceYear.split('-')[1], 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isPioneer) {
      const numHours = parseFloat(hours);
      if (isNaN(numHours) || numHours <= 0) {
        setErrorMessage('Por favor ingresa una cantidad válida de horas para el informe de precursor.');
        return;
      }
    } else if (!participated) {
      setErrorMessage('Debes marcar que participó en el ministerio o activar la opción de precursor.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.saveS21Record({
        user_id: publisher.id,
        service_year: serviceYear,
        month_number: monthNumber,
        calendar_year: currentCalendarYear,
        shared_in_ministry: isPioneer ? true : participated,
        auxiliary_pioneer: isPioneer,
        hours: isPioneer ? parseFloat(hours) : null,
        bible_courses: Number(bibleCourses) || 0,
        notes: notes.trim() || null,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando el informe en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Informe de Predicación"
      subtitle="Datos mensuales para la Ficha Oficial de Registro S-21"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* 1. Publicador: Seleccionado automáticamente */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Publicador (Seleccionado automáticamente)
          </label>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">{publisher.fullName}</span>
                <span className="text-[11px] text-slate-500 font-mono">{publisher.email}</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
              {publisher.role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* 2. Año de Servicio y Mes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Año de Servicio
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <select
                value={serviceYear}
                onChange={(e) => setServiceYear(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="2026-2027">2026 - 2027</option>
                <option value="2027-2028">2027 - 2028</option>
                <option value="2028-2029">2028 - 2029</option>
                <option value="2029-2030">2029 - 2030</option>
                <option value="2030-2031">2030 - 2031</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mes Teocrático
            </label>
            <select
              value={monthNumber}
              onChange={(e) => setMonthNumber(parseInt(e.target.value, 10))}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                const yr = num >= 9 ? serviceYear.split('-')[0] : serviceYear.split('-')[1];
                return (
                  <option key={num} value={num}>
                    {MONTH_NAMES[num]} ({yr})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 3. Selección Condicional según requerimiento */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
          <div className="text-xs font-bold text-slate-800">Tipo de Informe en el Mes</div>

          {/* Opción A: Participó en el ministerio (Publicador) */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="participatedCheck"
              checked={participated}
              onChange={(e) => handleParticipatedChange(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
            />
            <label htmlFor="participatedCheck" className="text-xs text-slate-800 cursor-pointer">
              <span className="font-semibold block">Participó en la predicación</span>
              <span className="text-[11px] text-slate-500">
                Para publicadores que compartieron en el ministerio durante el mes (no informan horas).
              </span>
            </label>
          </div>

          {/* Opción B: Precursor */}
          {!participated && (
            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/80">
              <input
                type="checkbox"
                id="pioneerCheck"
                checked={isPioneer}
                onChange={(e) => handlePioneerChange(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
              />
              <label htmlFor="pioneerCheck" className="text-xs text-slate-800 cursor-pointer">
                <span className="font-semibold block">Precursor</span>
                <span className="text-[11px] text-slate-500">
                  Precursor regular o precursor auxiliar en este mes (reporta horas).
                </span>
              </label>
            </div>
          )}

          {/* Alternativa rápida de cambio cuando 'Participó' está checado */}
          {participated && (
            <div className="text-[11px] text-slate-500 pt-1">
              ¿Sirvió como precursor en este mes?{' '}
              <button
                type="button"
                onClick={() => {
                  setParticipated(false);
                  setIsPioneer(true);
                }}
                className="text-slate-900 font-semibold underline hover:text-slate-700"
              >
                Activar informe de Precursor
              </button>
            </div>
          )}

          {isPioneer && (
            <div className="text-[11px] text-slate-500 pt-1">
              ¿Solo participó como publicador?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsPioneer(false);
                  setParticipated(true);
                  setHours('');
                }}
                className="text-slate-900 font-semibold underline hover:text-slate-700"
              >
                Marcar sólo que participó
              </button>
            </div>
          )}
        </div>

        {/* 4. Campo de Horas: SÓLO visible si Precursor está activado */}
        {isPioneer && (
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              Cantidad de Horas Realizadas *
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                placeholder="Ej. 30 o 50"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <span className="text-[10px] text-slate-400">
              Requerido exclusivamente para precursores.
            </span>
          </div>
        )}

        {/* 5. Cursos Bíblicos: Visible en ambos casos */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cursos Bíblicos
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="number"
              min="0"
              value={bibleCourses}
              onChange={(e) => setBibleCourses(parseInt(e.target.value, 10) || 0)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* 6. Observaciones / Notas */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notas u Observaciones
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Notas adicionales (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Informe S-21'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
