import React, { useState, useEffect } from 'react';
import { apiService, PublicPublisherInfo } from '../../services/apiService';
import { Button } from '../common/Button';
import {
  Phone,
  UserCheck,
  Calendar,
  BookOpen,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowLeft,
  Users,
  Building2,
  Sparkles,
  Send,
  RotateCcw,
} from 'lucide-react';

interface PublicReportFormProps {
  onBack?: () => void;
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

export const PublicReportForm: React.FC<PublicReportFormProps> = ({ onBack }) => {
  // Teléfono ingresado
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSearchingPhone, setIsSearchingPhone] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [publisher, setPublisher] = useState<PublicPublisherInfo | null>(null);

  // Datos del informe
  const [serviceYear, setServiceYear] = useState<string>('2026-2027');
  const [monthNumber, setMonthNumber] = useState<number>(() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth;
  });

  const [participated, setParticipated] = useState<boolean>(true);
  const [isPioneer, setIsPioneer] = useState<boolean>(false);
  const [hours, setHours] = useState<string>('');
  const [bibleCourses, setBibleCourses] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Estados de consulta y envío
  const [existingRecord, setExistingRecord] = useState<any | null>(null);
  const [isCheckingReport, setIsCheckingReport] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [submittedDataSummary, setSubmittedDataSummary] = useState<any | null>(null);

  // Buscar automáticamente cuando el teléfono tenga al menos 7 u 8 dígitos
  useEffect(() => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length >= 8 && !publisher) {
      handleSearchPublisher();
    }
  }, [phoneInput]);

  // Si cambia el publicador o el mes, verificar si ya envió informe para ese mes
  useEffect(() => {
    if (!publisher) {
      setExistingRecord(null);
      return;
    }

    let isMounted = true;
    setIsCheckingReport(true);
    setExistingRecord(null);
    apiService
      .getPublicReportStatus(publisher.id, serviceYear, monthNumber)
      .then((res) => {
        if (!isMounted) return;
        if (res.exists && res.record) {
          setExistingRecord(res.record);
          // Si ya existe registro previo, pre-cargar sus valores para conveniencia
          const isPioneerRecord = Boolean(res.record.auxiliary_pioneer);
          setIsPioneer(isPioneerRecord);
          setParticipated(Boolean(res.record.shared_in_ministry));
          setHours(res.record.hours != null ? String(res.record.hours) : '');
          setBibleCourses(res.record.bible_courses || 0);
          setNotes(res.record.notes || '');
        } else {
          setExistingRecord(null);
          // Valores por defecto según el rol del publicador
          const isDefaultPioneer = Boolean(publisher.isRegularPioneer || publisher.isAuxiliaryPioneer);
          setIsPioneer(isDefaultPioneer);
          setParticipated(!isDefaultPioneer);
          setHours('');
          setBibleCourses(0);
          setNotes('');
        }
      })
      .catch(() => {
        if (isMounted) setExistingRecord(null);
      })
      .finally(() => {
        if (isMounted) setIsCheckingReport(false);
      });

    return () => {
      isMounted = false;
    };
  }, [publisher?.id, serviceYear, monthNumber]);

  const handleSearchPublisher = async () => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 4) {
      setSearchError('Por favor ingresa un número de teléfono válido (mínimo 4 dígitos).');
      return;
    }

    setIsSearchingPhone(true);
    setSearchError('');
    try {
      const res = await apiService.getPublisherByPhone(clean);
      if (res.found && res.publisher) {
        setPublisher(res.publisher);
        setSearchError('');
      } else {
        setPublisher(null);
        setSearchError(
          res.message ||
            'No se encontró ningún publicador activo con este número de teléfono. Verifica tus dígitos o contacta al secretario de la congregación.'
        );
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error al buscar el número de teléfono en el servidor.');
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleResetPublisher = () => {
    setPublisher(null);
    setPhoneInput('');
    setSearchError('');
    setExistingRecord(null);
    setIsSubmittedSuccess(false);
  };

  const handleParticipatedChange = (checked: boolean) => {
    setParticipated(checked);
    if (checked) {
      setIsPioneer(false);
      setHours('');
    }
  };

  const handlePioneerChange = (checked: boolean) => {
    setIsPioneer(checked);
    if (checked) {
      setParticipated(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisher) return;
    if (isCheckingReport || existingRecord) return;
    setSubmitError('');

    if (isPioneer) {
      const numHours = parseFloat(hours);
      if (isNaN(numHours) || numHours <= 0) {
        setSubmitError('Por favor ingresa la cantidad de horas realizadas en el mes.');
        return;
      }
    } else if (!participated) {
      setSubmitError('Debes marcar que participaste en el ministerio o indicar si serviste como precursor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.submitPublicReport({
        userId: publisher.id,
        phone: phoneInput.trim(),
        serviceYear,
        monthNumber,
        sharedInMinistry: isPioneer ? true : participated,
        auxiliaryPioneer: isPioneer,
        hours: isPioneer ? parseFloat(hours) : null,
        bibleCourses: Number(bibleCourses) || 0,
        notes: notes.trim() || null,
      });

      setSubmittedDataSummary({
        publisherName: publisher.fullName,
        serviceGroup: publisher.serviceGroup,
        congregationName: publisher.congregationName,
        serviceYear,
        monthName: MONTH_NAMES[monthNumber] || `Mes ${monthNumber}`,
        sharedInMinistry: isPioneer ? true : participated,
        auxiliaryPioneer: isPioneer,
        hours: isPioneer ? hours : null,
        bibleCourses: Number(bibleCourses) || 0,
        notes: notes.trim(),
      });

      setIsSubmittedSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Error al enviar el informe. Por favor intenta de nuevo.');
      apiService
        .getPublicReportStatus(publisher.id, serviceYear, monthNumber)
        .then((res) => {
          if (res.exists && res.record) setExistingRecord(res.record);
        })
        .catch((statusError) => {
          console.error('Error al verificar el informe mensual:', statusError);
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto">
        {/* Cabecera / Navegación Superior */}
        <div className="flex items-center justify-between mb-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver / Iniciar Sesión</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Registro de actividad</span>
          </div>
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Header estilizado */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                Acceso Directo
              </span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400">
                · Detección Automática
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Informe Mensual de Predicación
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Ingresa tu número de teléfono registrado para identificar automáticamente tu nombre,
              grupo de servicio y congregación.
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Pantalla de Éxito tras enviar */}
            {isSubmittedSuccess && submittedDataSummary ? (
              <div className="text-center py-6 space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">¡Informe Enviado con Éxito!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tu informe ha sido registrado correctamente en la tarjeta oficial S-21 de la
                    congregación.
                  </p>
                </div>

                {/* Resumen del informe enviado */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Publicador:</span>
                    <strong className="text-slate-900 font-semibold">
                      {submittedDataSummary.publisherName}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Grupo de Servicio:</span>
                    <strong className="text-slate-900 font-semibold">
                      Grupo #{submittedDataSummary.serviceGroup}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Mes Informado:</span>
                    <strong className="text-slate-900 font-semibold">
                      {submittedDataSummary.monthName} ({submittedDataSummary.serviceYear})
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Actividad:</span>
                    <strong className="text-slate-900 font-semibold">
                      {submittedDataSummary.auxiliaryPioneer
                        ? `Precursor (${submittedDataSummary.hours} horas)`
                        : 'Participó en el ministerio'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Cursos Bíblicos:</span>
                    <strong className="text-slate-900 font-semibold">
                      {submittedDataSummary.bibleCourses}
                    </strong>
                  </div>
                  {submittedDataSummary.notes && (
                    <div className="pt-1">
                      <span className="text-slate-500 block">Notas:</span>
                      <p className="text-slate-800 italic">{submittedDataSummary.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleResetPublisher();
                    }}
                    className="w-full sm:w-auto text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Cambiar publicador
                  </Button>
                  {onBack && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onBack}
                      className="w-full sm:w-auto text-xs"
                    >
                      Volver a la aplicación
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* PASO 1: Identificación por Teléfono */}
                {!publisher ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Paso 1: Escribe tu número de teléfono
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            inputMode="tel"
                            placeholder="Ej. 7123-4567 o 71234567"
                            value={phoneInput}
                            onChange={(e) => {
                              setPhoneInput(e.target.value);
                              setSearchError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearchPublisher();
                              }
                            }}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleSearchPublisher}
                          isLoading={isSearchingPhone}
                          className="shrink-0 text-xs px-4"
                        >
                          <Search className="w-3.5 h-3.5 mr-1" />
                          Buscar
                        </Button>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Ingresa el teléfono con el que estás anotado en el directorio de la congregación.
                      </span>
                    </div>

                    {searchError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">No pudimos identificarte</strong>
                          <span>{searchError}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>¿Cómo funciona este formulario?</span>
                      </div>
                      <p>
                        No necesitas recordar contraseñas ni correos. Al poner tu número de teléfono,
                        el sistema busca tu ficha de publicador y te permite rellenar tu informe mensual
                        fácilmente desde tu celular.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Publicador Identificado: Tarjeta de Verificación */
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                              Publicador Identificado
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-slate-900 leading-tight">
                            {publisher.fullName}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                              <Users className="w-3 h-3 text-emerald-700" />
                              Grupo #{publisher.serviceGroup}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-slate-700">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {publisher.congregationName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetPublisher}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium underline shrink-0 cursor-pointer"
                        title="Cambiar número o corregir"
                      >
                        ¿No eres tú? Cambiar
                      </button>
                    </div>

                    {isCheckingReport && (
                      <div className="text-xs text-slate-500 text-center py-1">
                        Comprobando informe del mes seleccionado...
                      </div>
                    )}

                    {/* FORMULARIO DE INFORME MENSUAL */}
                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                      {submitError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {/* Selector de Año y Mes */}
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
                              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
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
                            Mes del Informe *
                          </label>
                          <select
                            value={monthNumber}
                            onChange={(e) => setMonthNumber(parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                          >
                            {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                              const yr =
                                num >= 9 ? serviceYear.split('-')[0] : serviceYear.split('-')[1];
                              return (
                                <option key={num} value={num}>
                                  {MONTH_NAMES[num]} ({yr})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {existingRecord && !isCheckingReport ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">
                              Ya enviaste tu informe para este mes
                            </span>
                            <span className="text-amber-800">
                              Cada publicador puede enviar un solo informe por mes. Selecciona otro mes
                              si necesitas registrar un informe diferente.
                            </span>
                          </div>
                        </div>
                      ) : (
                      <>
                      {/* Selección Condicional según requerimiento oficial */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                        <div className="text-xs font-bold text-slate-800">
                          Tu participación en el mes
                        </div>

                        {/* Opción 1: Participó en el ministerio */}
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id="publicReportParticipated"
                            checked={participated}
                            onChange={(e) => handleParticipatedChange(e.target.checked)}
                            className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
                          />
                          <label
                            htmlFor="publicReportParticipated"
                            className="text-xs text-slate-800 cursor-pointer"
                          >
                            <span className="font-semibold block">
                              Participé en la predicación
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Marca esta casilla si predicaste en el mes como publicador regular. No
                              es necesario indicar horas.
                            </span>
                          </label>
                        </div>

                        {/* Opción 2: Precursor */}
                        {!participated && (
                          <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/80">
                            <input
                              type="checkbox"
                              id="publicReportPioneer"
                              checked={isPioneer}
                              onChange={(e) => handlePioneerChange(e.target.checked)}
                              className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
                            />
                            <label
                              htmlFor="publicReportPioneer"
                              className="text-xs text-slate-800 cursor-pointer"
                            >
                              <span className="font-semibold block">
                                Serví como Precursor (Regular o Auxiliar)
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Activa esta casilla para registrar las horas que realizaste en el
                                mes.
                              </span>
                            </label>
                          </div>
                        )}

                        {participated && (
                          <div className="text-[11px] text-slate-500 pt-1">
                            ¿Hiciste el precursorado auxiliar o regular?{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setParticipated(false);
                                setIsPioneer(true);
                              }}
                              className="text-slate-900 font-semibold underline hover:text-slate-700 cursor-pointer"
                            >
                              Activar informe con horas de precursor
                            </button>
                          </div>
                        )}

                        {isPioneer && (
                          <div className="text-[11px] text-slate-500 pt-1">
                            ¿Solo participaste como publicador regular?{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setIsPioneer(false);
                                setParticipated(true);
                                setHours('');
                              }}
                              className="text-slate-900 font-semibold underline hover:text-slate-700 cursor-pointer"
                            >
                              Marcar únicamente que participaste
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Campo de Horas: SÓLO si Precursor está activado */}
                      {isPioneer && (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                          <label className="block text-xs font-bold text-slate-800">
                            Cantidad de Horas Realizadas *
                          </label>
                          <div className="relative">
                            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              required
                              placeholder="Ej. 15, 30 o 50"
                              value={hours}
                              onChange={(e) => setHours(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Requerido exclusivamente para precursores.
                          </span>
                        </div>
                      )}

                      {/* Cursos Bíblicos */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Cursos Bíblicos Dirigidos en el Mes
                        </label>
                        <div className="relative">
                          <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="number"
                            min="0"
                            value={bibleCourses}
                            onChange={(e) => setBibleCourses(parseInt(e.target.value, 10) || 0)}
                            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      {/* Notas u Observaciones */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Notas u Observaciones (Opcional)
                        </label>
                        <div className="relative">
                          <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Comentarios adicionales o aclaraciones..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      {/* Botón de Envío */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          className="w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                          disabled={isSubmitting || isCheckingReport || Boolean(existingRecord)}
                          isLoading={isSubmitting}
                        >
                          <Send className="w-4 h-4" />
                          <span>
                            Enviar Mi Informe
                          </span>
                        </Button>
                      </div>
                      </>
                      )}
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pie de página con aviso de privacidad y soporte */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>Organización de la Predicación</p>
          <p className="text-[11px] text-slate-400">
            Los datos enviados se guardan de forma segura y solo pueden ser consultados por el
            secretario y los ancianos de tu congregación.
          </p>
        </div>
      </div>
    </div>
  );
};
