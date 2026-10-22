import React, { useState, useEffect } from 'react';
import { Congregation, ServiceYearReport } from '../../types';
import { apiService } from '../../services/apiService';
import { Download, FileText, BarChart3, Users, Clock, BookOpen, RefreshCw } from 'lucide-react';

interface CalendarAndReportsViewProps {
  congregation: Congregation;
}

export const CalendarAndReportsView: React.FC<CalendarAndReportsViewProps> = ({ congregation }) => {
  const [serviceYear, setServiceYear] = useState<string>('2026-2027');
  const [report, setReport] = useState<ServiceYearReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReport();
  }, [congregation.id, serviceYear]);

  async function loadReport() {
    setLoading(true);
    try {
      const repData = await apiService.getServiceYearReport(serviceYear);
      setReport(repData);
    } catch (err) {
      console.error('Error al cargar informes de predicación', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadCsv = () => {
    const url = apiService.getCsvExportUrl(serviceYear);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles y Selector de Año de Servicio */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Informes de Predicación · {congregation.name}
            </h2>
            <p className="text-xs text-slate-500">
              Año de Servicio Teocrático ({serviceYear}) · 1 de Septiembre al 31 de Agosto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={serviceYear}
            onChange={(e) => setServiceYear(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2026-2027">Año de Servicio 2026-2027</option>
            <option value="2027-2028">Año de Servicio 2027-2028</option>
            <option value="2028-2029">Año de Servicio 2028-2029</option>
            <option value="2029-2030">Año de Servicio 2029-2030</option>
            <option value="2030-2031">Año de Servicio 2030-2031</option>
          </select>

          <button
            onClick={loadReport}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Recargar informe"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Horas Acumuladas</span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {report?.total_hours ?? 0} hrs
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Cursos Bíblicos</span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {report?.total_bible_courses ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Publicadores en Registro</span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {report?.total_publishers ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Desglose Mensual Oficial */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Desglose Mensual de la Congregación
          </span>
          <span className="text-[11px] text-slate-400">
            Formulario de Informe Mensual de la Congregacion
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 border-r border-slate-200">Mes</th>
                <th className="p-3 border-r border-slate-200 text-center">Publicadores que informaron</th>
                <th className="p-3 border-r border-slate-200 text-center">Precursores</th>
                <th className="p-3 border-r border-slate-200 text-center">Cursos bíblicos</th>
                <th className="p-3 text-center">Total horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.monthly_breakdown?.map((m) => (
                <tr key={m.month_number} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-900 border-r border-slate-100">
                    {m.month_name} {m.calendar_year}
                  </td>
                  <td className="p-3 text-center border-r border-slate-100 font-mono text-emerald-700 font-medium">
                    {m.publishers_reporting_activity}
                  </td>
                  <td className="p-3 text-center border-r border-slate-100 font-mono">
                    {m.auxiliary_pioneers_count}
                  </td>
                  <td className="p-3 text-center border-r border-slate-100 font-mono">
                    {m.total_bible_courses}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-indigo-700">
                    {m.total_hours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
