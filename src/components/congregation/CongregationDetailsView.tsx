import React, { useState, useEffect } from 'react';
import { Congregation } from '../../types';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Building2, MapPin, Save, Check, ExternalLink, Shield } from 'lucide-react';

interface CongregationDetailsViewProps {
  congregation: Congregation;
  onUpdateCongregation?: (updated: Congregation) => void;
}

export const CongregationDetailsView: React.FC<CongregationDetailsViewProps> = ({
  congregation,
  onUpdateCongregation,
}) => {
  const { currentUser } = useAuth();
  const isPublisher = currentUser?.role === 'PUBLICADOR' && !currentUser?.isMasterAdmin;

  const [formData, setFormData] = useState<Partial<Congregation>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      name: congregation.name || '',
      circuit: congregation.circuit || '',
      city: congregation.city || '',
      address: congregation.address || '',
      latitude: congregation.latitude ?? undefined,
      longitude: congregation.longitude ?? undefined,
      timezone: congregation.timezone || 'America/El_Salvador',
    });
  }, [congregation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPublisher) return;

    setSaving(true);
    try {
      const updated = await apiService.updateCongregationSettings(formData, {} as any);
      setSaveSuccess(true);
      if (onUpdateCongregation) onUpdateCongregation(updated);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error guardando datos del salón:', err);
      alert('Error al guardar datos de la congregación');
    } finally {
      setSaving(false);
    }
  };

  const googleMapsUrl =
    formData.latitude && formData.longitude
      ? `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`
      : null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Datos Generales de la Congregación y Salón del Reino
            </h1>
            <p className="text-xs text-slate-500">
              {congregation.name} · Circuito {congregation.circuit || 'SLV-37'}
            </p>
          </div>
        </div>

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Ver Salón en Google Maps
            <ExternalLink className="w-3 h-3 text-indigo-400" />
          </a>
        )}
      </div>

      {isPublisher && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo de sólo lectura:</strong> Como publicador puedes consultar los horarios y ubicación del Salón del Reino. La modificación de datos está reservada exclusivamente para el cuerpo de ancianos y coordinadores.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nombre de la Congregación
            </label>
            <input
              type="text"
              value={formData.name || ''}
              disabled={isPublisher || saving}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Circuito Teocrático
            </label>
            <input
              type="text"
              value={formData.circuit || ''}
              disabled={isPublisher || saving}
              onChange={(e) => setFormData({ ...formData, circuit: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ciudad / Municipio
            </label>
            <input
              type="text"
              value={formData.city || ''}
              disabled={isPublisher || saving}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Zona Horaria
            </label>
            <input
              type="text"
              value={formData.timezone || 'America/El_Salvador'}
              disabled={isPublisher || saving}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        {/* Ubicación y GPS del Salón del Reino */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500" />
            Ubicación Física y Coordenadas GPS del Salón del Reino
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Dirección del Salón del Reino
            </label>
            <input
              type="text"
              placeholder="Ej: 2A Calle Oriente, Barrio Concepción"
              value={formData.address || ''}
              disabled={isPublisher || saving}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Latitud GPS
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ej: 13.3364"
                value={formData.latitude ?? ''}
                disabled={isPublisher || saving}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Longitud GPS
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ej: -87.8439"
                value={formData.longitude ?? ''}
                disabled={isPublisher || saving}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardado sólo si no es publicador */}
        {!isPublisher && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  Datos de la congregación actualizados en PostgreSQL
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : 'Guardar Ajustes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
