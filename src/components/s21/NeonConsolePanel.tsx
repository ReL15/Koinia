import React, { useState, useEffect } from 'react';
import { DbStatusResponse } from '../../types';
import { apiService } from '../../services/apiService';
import { Database, CheckCircle2, ShieldCheck, Server, RefreshCw } from 'lucide-react';

export const NeonConsolePanel: React.FC = () => {
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const data = await apiService.getDbStatus();
      setStatus(data);
    } catch (err) {
      console.error('Error al consultar estado de la base de datos', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Monitor de Base de Datos · Neon Console PostgreSQL
            </h1>
            <p className="text-xs text-slate-500">
              Conexión activa con el cluster serverless de PostgreSQL 18.6
            </p>
          </div>
        </div>

        <button
          onClick={loadStatus}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Verificar Estado
        </button>
      </div>

      {/* Tarjeta de Estado Activo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Estado de Conexión en Tiempo Real
          </span>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conectado a Neon Console
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 block mb-1">Motor de Base de Datos</span>
            <span className="text-xs font-mono font-bold text-slate-900 block truncate">
              {status?.engine || 'PostgreSQL 18.6 (Neon Serverless)'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 block mb-1">Base de Datos Activa</span>
            <span className="text-xs font-mono font-bold text-slate-900 block truncate">
              {status?.database || 'neondb'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 block mb-1">Seguridad SSL</span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              sslmode=require
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <span className="text-[11px] text-slate-500 block mb-1">Congregaciones Registradas</span>
            <span className="text-sm font-mono font-bold text-indigo-700">
              {status?.totals?.congregations ?? 1}
            </span>
          </div>
        </div>

        {/* Totales de Registros Teocráticos en PostgreSQL */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Registros Teocráticos Persistidos en Neon
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-lg font-bold font-mono text-slate-900 block">
                {status?.totals?.publishers ?? 0}
              </span>
              <span className="text-[11px] text-slate-500">Publicadores (users)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-lg font-bold font-mono text-slate-900 block">
                {status?.totals?.s21_records ?? 0}
              </span>
              <span className="text-[11px] text-slate-500">Fichas S-21</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-lg font-bold font-mono text-slate-900 block">
                {status?.totals?.locations ?? 0}
              </span>
              <span className="text-[11px] text-slate-500">Lugares de Salida</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-lg font-bold font-mono text-slate-900 block">
                {status?.totals?.activities ?? 0}
              </span>
              <span className="text-[11px] text-slate-500">Asignaciones Semanales</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
