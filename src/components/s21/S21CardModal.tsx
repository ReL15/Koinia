import React, { useState, useEffect } from 'react';
import { UserProfile, S21Record } from '../../types';
import { apiService } from '../../services/apiService';
import { S21ReportFormModal } from './S21ReportFormModal';
import {
  X,
  Printer,
  Calendar,
  BookOpen,
  Clock,
  ShieldCheck,
  Check,
  PlusCircle,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';

interface S21CardModalProps {
  publisher: UserProfile | null;
  congregationName: string;
  readOnly?: boolean;
  onClose: () => void;
  onUpdatePublisher?: (updated: UserProfile) => void;
}

export const S21CardModal: React.FC<S21CardModalProps> = ({
  publisher,
  congregationName,
  readOnly = false,
  onClose,
}) => {
  const [serviceYear, setServiceYear] = useState<string>('2026-2027');
  const [records, setRecords] = useState<Record<number, Partial<S21Record>>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Control para abrir el formulario de registro de informe
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingMonth, setEditingMonth] = useState<number | undefined>(undefined);
  const [editingRecord, setEditingRecord] = useState<Partial<S21Record> | null>(null);

  const serviceMonths = [
    { num: 9, name: 'Septiembre', defaultYear: parseInt(serviceYear.split('-')[0], 10) },
    { num: 10, name: 'Octubre', defaultYear: parseInt(serviceYear.split('-')[0], 10) },
    { num: 11, name: 'Noviembre', defaultYear: parseInt(serviceYear.split('-')[0], 10) },
    { num: 12, name: 'Diciembre', defaultYear: parseInt(serviceYear.split('-')[0], 10) },
    { num: 1, name: 'Enero', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 2, name: 'Febrero', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 3, name: 'Marzo', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 4, name: 'Abril', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 5, name: 'Mayo', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 6, name: 'Junio', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 7, name: 'Julio', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
    { num: 8, name: 'Agosto', defaultYear: parseInt(serviceYear.split('-')[1], 10) },
  ];

  useEffect(() => {
    if (!publisher) return;
    loadRecords();
  }, [publisher?.id, serviceYear]);

  async function loadRecords() {
    if (!publisher) return;
    setLoading(true);
    try {
      const data = await apiService.getS21Records(publisher.id, serviceYear);
      const mapped: Record<number, Partial<S21Record>> = {};
      data.forEach((r) => {
        mapped[r.month_number] = r;
      });
      setRecords(mapped);
    } catch (err) {
      console.error('Error al cargar registros S-21', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenNewReport = (monthNum?: number) => {
    if (monthNum && records[monthNum]) {
      setEditingMonth(monthNum);
      setEditingRecord(records[monthNum] || null);
    } else {
      setEditingMonth(monthNum || 9);
      setEditingRecord(monthNum && records[monthNum] ? records[monthNum] : null);
    }
    setIsFormOpen(true);
  };

  const handlePrint = () => {
    if (loading || !publisher) {
      if (!publisher) return;
      alert('Espera a que termine de cargar el registro S-21 antes de imprimir.');
      return;
    }

    const cardEl = document.getElementById('s21-printable-card');
    if (!cardEl) {
      window.print();
      return;
    }

    // Crear un iframe invisible para aislar completamente el documento a imprimir sin hojas en blanco
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.zIndex = '-9999';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    // Clonar el contenido para manipularlo limpiamente
    const clone = cardEl.cloneNode(true) as HTMLElement;

    // Remover botones y elementos de acción interactivos
    clone.querySelectorAll('.print\\:hidden, button').forEach((el) => {
      el.remove();
    });

    // Ajustar colspan del tfoot para cuadrar con la columna de acción eliminada
    clone.querySelectorAll('tfoot td[colspan]').forEach((td) => {
      td.setAttribute('colspan', '1');
    });

    // Asegurar que el año de servicio se muestre como texto legible en lugar del selector
    const yearSelect = clone.querySelector('select');
    if (yearSelect) {
      const yearText = document.createElement('span');
      yearText.textContent = serviceYear;
      yearText.style.fontWeight = '700';
      yearSelect.parentNode?.replaceChild(yearText, yearSelect);
    }

    // Copiar estilos y tipografías del documento principal
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Registro de Publicador S-21 - ${publisher.fullName}</title>
          ${styles}
          <style>
            @page {
              size: portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            #s21-printable-card {
              border: 1px solid #cbd5e1 !important;
              border-radius: 8px !important;
              box-shadow: none !important;
              max-height: none !important;
              overflow: visible !important;
              width: 100% !important;
              background: #ffffff !important;
              color: #0f172a !important;
            }
            .overflow-y-auto {
              overflow: visible !important;
              max-height: none !important;
            }
            .print\\:hidden, .print-hidden {
              display: none !important;
            }
            .print\\:inline {
              display: inline !important;
            }
            .print\\:block {
              display: block !important;
            }
            /* Cabecera clara y nítida */
            .bg-slate-900 {
              background-color: #ffffff !important;
              color: #0f172a !important;
              border-bottom: 2px solid #0f172a !important;
              padding: 12px 16px !important;
            }
            .bg-slate-900 h2 {
              color: #0f172a !important;
              font-size: 16px !important;
            }
            .bg-slate-900 span, .bg-slate-900 div {
              color: #334155 !important;
            }
            .bg-slate-900 strong {
              color: #0f172a !important;
            }
            /* Tabla con bordes y fondos nítidos */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              border: 1px solid #cbd5e1 !important;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
              font-weight: 700 !important;
            }
            tfoot {
              background-color: #f8fafc !important;
              font-weight: 700 !important;
            }
          </style>
        </head>
        <body>
          <div id="s21-printable-card">
            ${clone.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 500);
    };

    printFrame.contentWindow?.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(cleanup, 4000);
    }, 300);
  };

  if (!publisher) return null;

  const totalHours = Object.values(records).reduce((sum, r) => sum + (Number(r?.hours) || 0), 0);
  const totalCourses = Object.values(records).reduce((sum, r) => sum + (Number(r?.bible_courses) || 0), 0);
  const activeMonths = Object.values(records).filter((r) => r?.shared_in_ministry).length;
  const avgHours = activeMonths > 0 ? (totalHours / activeMonths).toFixed(1) : '0.0';

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
        <div
          id="s21-printable-card"
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none print:max-h-none print:overflow-visible"
        >
          {/* Cabecera oficial S-21 unificada con la estética del sitio */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-start justify-between border-b border-slate-800 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900 print:px-0">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold print:border-slate-400 print:bg-transparent print:text-slate-900">
                  Formulario Oficial S-21 (Ed. 11/23)
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 print:text-slate-700 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 print:hidden" />
                  <span>Año de Servicio:</span>
                  <select
                    value={serviceYear}
                    onChange={(e) => setServiceYear(e.target.value)}
                    className="bg-slate-800 text-white text-xs rounded-md px-2 py-0.5 border border-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer print:hidden"
                  >
                    <option value="2026-2027">2026 - 2027</option>
                    <option value="2027-2028">2027 - 2028</option>
                    <option value="2028-2029">2028 - 2029</option>
                    <option value="2029-2030">2029 - 2030</option>
                    <option value="2030-2031">2030 - 2031</option>
                  </select>
                  <span className="hidden print:inline font-bold text-slate-900">{serviceYear}</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-white print:text-slate-900 tracking-tight">
                Registro de Publicador de la Congregación · {publisher.fullName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 print:text-slate-600">
                <span>
                  Congregación: <strong className="text-slate-200 print:text-slate-900">{congregationName}</strong>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 print:hidden" />
                  Rol: <strong className="text-slate-200 print:text-slate-900">{publisher.role.replace(/_/g, ' ')}</strong>
                </span>
                {publisher.roles && publisher.roles.length > 1 && (
                  <>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      {publisher.roles
                        .filter((r) => r !== publisher.role)
                        .map((r) => (
                          <span
                            key={r}
                            className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 print:border-slate-300 print:bg-transparent print:text-slate-700"
                          >
                            {r.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              {readOnly ? (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Solo Lectura (Secretaría)
                </span>
              ) : (
                <button
                  onClick={() => handleOpenNewReport()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Registrar o actualizar informe mensual"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Registrar Informe
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:text-white hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir tarjeta S-21"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                Imprimir
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Resumen de Métricas (Solo lectura) */}
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 print:bg-white print:border-b print:px-0">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5 print:shadow-none">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center print:hidden">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Meses Activo</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{activeMonths} / 12</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5 print:shadow-none">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center print:hidden">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Horas</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{totalHours} hrs</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5 print:shadow-none">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center print:hidden">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Cursos Bíblicos</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{totalCourses}</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5 print:shadow-none">
              <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center print:hidden">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Promedio Horas</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{avgHours} / mes</span>
              </div>
            </div>
          </div>

          {/* Tabla Oficial S-21 (Solo Lectura para Ver e Imprimir) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 print:p-0 print:overflow-visible">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Cargando ficha S-21 desde base de datos...
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs print:rounded-none print:shadow-none">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px] print:bg-slate-100">
                    <tr>
                      <th className="p-3 border-r border-slate-200 w-28">Mes</th>
                      <th className="p-3 border-r border-slate-200 text-center w-28">Participó en el ministerio</th>
                      <th className="p-3 border-r border-slate-200 text-center w-24">Cursos bíblicos</th>
                      <th className="p-3 border-r border-slate-200 text-center w-24">Precursor</th>
                      <th className="p-3 border-r border-slate-200 text-center w-24">Horas</th>
                      <th className="p-3 border-r border-slate-200">Notas</th>
                      {!readOnly && <th className="p-3 text-center w-16 print:hidden">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceMonths.map((m) => {
                      const rec = records[m.num];
                      const hasReport = Boolean(rec);
                      const shared = Boolean(rec?.shared_in_ministry);
                      const isPioneerMonth = Boolean(rec?.auxiliary_pioneer);

                      return (
                        <tr key={m.num} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-200 bg-slate-50/30">
                            {m.name}
                          </td>
                          <td className="p-2.5 text-center border-r border-slate-200">
                            {shared ? (
                              <span className="font-bold text-slate-900">✓</span>
                            ) : hasReport ? (
                              <span className="text-slate-300">—</span>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center border-r border-slate-200 font-mono">
                            {rec?.bible_courses != null && rec.bible_courses > 0 ? (
                              <span className="font-semibold text-slate-900">{rec.bible_courses}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center border-r border-slate-200">
                            {isPioneerMonth ? (
                              <span className="font-bold text-slate-900">✓</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center border-r border-slate-200 font-mono">
                            {rec?.hours != null && Number(rec.hours) > 0 ? (
                              <span className="font-bold text-slate-900">{rec.hours}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600 border-r border-slate-200 truncate max-w-xs">
                            {rec?.notes ? rec.notes : <span className="text-slate-300 italic">—</span>}
                          </td>
                          {!readOnly && (
                            <td className="p-2.5 text-center print:hidden">
                              <button
                                onClick={() => handleOpenNewReport(m.num)}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                title={`Editar informe de ${m.name}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-200 text-slate-900">
                    <tr>
                      <td className="p-3 border-r border-slate-200 uppercase text-[11px] font-bold text-slate-700">
                        TOTALES
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono text-slate-900">
                        {activeMonths} meses
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono">
                        {totalCourses}
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono text-slate-400">
                        -
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono text-slate-900 text-sm font-extrabold">
                        {totalHours}
                      </td>
                      <td colSpan={2} className="p-3 text-[11px] text-slate-600 font-medium">
                        Promedio: <strong className="text-slate-900">{avgHours} hrs/mes</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Barra inferior */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between print:hidden">
            <div className="text-xs text-slate-500">
              Formulario oficial de consulta e impresión. Para ingresar datos, usa el botón{' '}
              <strong className="text-slate-800">Registrar Informe</strong>.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Imprimir Tarjeta S-21
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para ingresar / rellenar el informe mensual */}
      {isFormOpen && (
        <S21ReportFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingRecord(null);
          }}
          publisher={publisher}
          initialServiceYear={serviceYear}
          initialMonthNumber={editingMonth}
          initialRecord={editingRecord}
          onSaved={() => {
            loadRecords();
          }}
        />
      )}
    </>
  );
};
