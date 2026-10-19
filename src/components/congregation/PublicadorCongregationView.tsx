import React from 'react';
import { Congregation, UserProfile, ServiceGroup } from '../../types';
import {
  Building2,
  MapPin,
  Users,
  UserCheck,
  Shield,
  Phone,
  Mail,
  ExternalLink,
  Compass,
  Clock,
  HeartHandshake,
  FileSpreadsheet,
} from 'lucide-react';

interface PublicadorCongregationViewProps {
  congregation: Congregation;
  currentUser: UserProfile;
  publishers: UserProfile[];
  serviceGroups: ServiceGroup[];
  onOpenReport?: () => void;
}

export const PublicadorCongregationView: React.FC<PublicadorCongregationViewProps> = ({
  congregation,
  currentUser,
  publishers,
  serviceGroups,
  onOpenReport,
}) => {
  const myGroupNumber = currentUser.serviceGroup || 1;
  const myGroup = serviceGroups.find((g) => g.groupNumber === myGroupNumber);

  // Dirigente y Auxiliar de su grupo
  const overseer = publishers.find((p) => p.id === myGroup?.overseerId);
  const assistant = publishers.find((p) => p.id === myGroup?.assistantId);

  // Compañeros del mismo grupo (excluyendo o incluyendo a sí mismo de manera destacada)
  const myGroupMembers = publishers
    .filter((p) => (p.serviceGroup || 1) === myGroupNumber)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const hasCoords = Boolean(congregation.latitude && congregation.longitude);
  const lat = congregation.latitude || 13.6929;
  const lng = congregation.longitude || -89.2182;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : congregation.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(congregation.address)}`
    : null;

  // OpenStreetMap embed URL para vista visual inmediata
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.004}%2C${lng + 0.005}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {congregation.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Portal de Consulta
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {congregation.city ? `${congregation.city} · ` : ''}
                Circuito {congregation.circuit || 'Congregacional'} · {congregation.timezone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Enviar Mi Informe Mensual</span>
              </button>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 flex items-center gap-2 font-medium">
              <Shield className="w-3.5 h-3.5 text-indigo-300" />
              <span>Modo Informativo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas: Salón del Reino y Mi Grupo de Servicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TARJETA 1: Salón del Reino y Mapa de Ubicación */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Salón del Reino de los Testigos de Jehová
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Ubicación oficial de las reuniones congregacionales
                  </span>
                </div>
              </div>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>Abrir Mapa</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Dirección Textual */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                Dirección Física:
              </div>
              <p className="text-slate-600 leading-relaxed pl-5">
                {congregation.address || 'Dirección no registrada. Por favor consulta con los ancianos de la congregación.'}
              </p>
              {congregation.city && (
                <p className="text-slate-500 text-[11px] pl-5">
                  Ciudad o Municipio: <strong>{congregation.city}</strong>
                </p>
              )}
            </div>

            {/* Mapa Interactivo */}
            <div className="w-full h-56 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner bg-slate-100">
              {hasCoords ? (
                <iframe
                  title="Mapa del Salón del Reino"
                  src={osmUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <MapPin className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Coordenadas GPS no configuradas</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    El coordinador puede fijar la posición exacta del salón desde los ajustes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Horarios según el programa semanal de reuniones de la congregación</span>
          </div>
        </div>

        {/* TARJETA 2: Mi Grupo de Servicio de Predicación */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Mi Grupo de Predicación
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Tu grupo asignado para la predicación y pastoreo
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-indigo-600 text-white shadow-xs">
                Grupo {myGroupNumber}
              </span>
            </div>

            {/* Dirigente y Auxiliar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Encargado / Dirigente */}
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                  Hermano Dirigente
                </span>
                {overseer ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {overseer.fullName}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold block">
                      {overseer.role.replace(/_/g, ' ')}
                    </span>
                    {overseer.phoneNumber && (
                      <a
                        href={`tel:${overseer.phoneNumber}`}
                        className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-1 font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        {overseer.phoneNumber}
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Por asignar por el cuerpo de ancianos</span>
                )}
              </div>

              {/* Auxiliar de Grupo */}
              <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block mb-1">
                  Hermano Auxiliar
                </span>
                {assistant ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {assistant.fullName}
                    </span>
                    <span className="text-[10px] text-sky-700 font-semibold block">
                      {assistant.role.replace(/_/g, ' ')}
                    </span>
                    {assistant.phoneNumber && (
                      <a
                        href={`tel:${assistant.phoneNumber}`}
                        className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-1 font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        {assistant.phoneNumber}
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Por asignar</span>
                )}
              </div>
            </div>

            {/* Lugar de reunión habitual del grupo */}
            {myGroup?.meetingPlace && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-4">
                <span className="font-semibold text-slate-900 block text-[11px] mb-0.5">
                  Lugar habitual de salida del grupo:
                </span>
                <span className="text-slate-600">{myGroup.meetingPlace}</span>
              </div>
            )}

            {/* Lista de Publicadores del Grupo */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Publicadores del Grupo {myGroupNumber} ({myGroupMembers.length})
              </span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {myGroupMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`px-3 py-2 flex items-center justify-between text-xs ${
                      member.id === currentUser.id ? 'bg-indigo-50/70 font-semibold text-indigo-950' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span className="truncate">{member.fullName}</span>
                      {member.id === currentUser.id && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900 font-bold">
                          Tú
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {member.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
            <span>Apoya con entusiasmo las salidas de tu grupo de servicio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
