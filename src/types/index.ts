/**
 * Tipos de datos estrictos para el Organizador de la Predicación Congregacional
 */

export type UserRole =
  | 'COORDINADOR'
  | 'SUPERINTENDENTE_DE_SERVICIO'
  | 'SECRETARIO'
  | 'ASISTENTE_SUPERINTENDENTE_SERVICIO'
  | 'ANCIANO'
  | 'SIERVO_MINISTERIAL'
  | 'PRECURSOR_REGULAR'
  | 'PRECURSOR_AUXILIAR'
  | 'PUBLICADOR';

/**
 * Jerarquía numérica de roles: a mayor número, mayor autoridad en el sistema.
 * El rol más alto asignado es el que manda para los permisos del usuario.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  COORDINADOR: 100,
  SUPERINTENDENTE_DE_SERVICIO: 80,
  SECRETARIO: 75,
  ASISTENTE_SUPERINTENDENTE_SERVICIO: 70,
  ANCIANO: 60,
  SIERVO_MINISTERIAL: 50,
  PRECURSOR_REGULAR: 35,
  PRECURSOR_AUXILIAR: 25,
  PUBLICADOR: 10,
};

export function computeHighestRole(roles?: (UserRole | string)[]): UserRole {
  if (!roles || roles.length === 0) return 'PUBLICADOR';
  let bestRole: UserRole = 'PUBLICADOR';
  let bestScore = 0;
  for (const r of roles) {
    const score = ROLE_HIERARCHY[r as UserRole] || 0;
    if (score > bestScore) {
      bestScore = score;
      bestRole = r as UserRole;
    }
  }
  return bestRole;
}

export type TerritoryStatus =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'INACTIVO';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Congregation {
  id: string;
  name: string;
  circuit?: string;
  city?: string;
  address?: string; // Dirección física del Salón del Reino
  latitude?: number; // Latitud GPS del Salón del Reino
  longitude?: number; // Longitud GPS del Salón del Reino
  logoUrl?: string;
  timezone: string; // ej: 'America/El_Salvador'
  createdAt: string;
  createdBy?: string;
}

export interface UserProfile {
  id: string; // ID único del publicador
  uid?: string; // Firebase Auth UID
  congregationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole; // Rol efectivo más alto
  roles?: UserRole[]; // Lista de roles asignados simultáneamente
  isElder?: boolean;
  isMinisterialServant?: boolean;
  isRegularPioneer?: boolean;
  isAuxiliaryPioneer?: boolean;
  isMasterAdmin?: boolean; // Usuario Maestro: puede alternar y administrar múltiples congregaciones
  canLeadPreaching: boolean; // Elegible para dirigir reuniones para el servicio del campo
  canPublicPreaching: boolean; // Elegible para carritos / predicación pública
  serviceGroup?: number; // Número del grupo de predicación asignado (1, 2, 3...)
  address?: string; // Dirección de domicilio del publicador
  active: boolean;
  hasPassword?: boolean;
  createdAt: string;
}

export interface ServiceGroup {
  id: string;
  congregationId: string;
  groupNumber: number;
  name?: string;
  overseerId?: string; // ID del hermano que dirige el grupo (anciano/siervo)
  overseerName?: string;
  assistantId?: string; // ID del hermano auxiliar de grupo
  assistantName?: string;
  meetingPlace?: string;
  createdAt?: string;
}

export interface PreachingPlace {
  id: string;
  congregationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface Territory {
  id: string;
  congregationId: string;
  number: string;
  name?: string;
  description?: string;
  status: TerritoryStatus;
  polygon: GeoPoint[];
  active: boolean;
  observations?: string;
  lastAssignedDate?: string;
  lastAssignedToId?: string;
  lastAssignedToName?: string;
  lastCompletedDate?: string;
  lastProgress?: string; // Dónde quedó el territorio (calle, manzana, casa, etc.)
  lastProgressDate?: string; // Fecha del último avance registrado
  lastProgressPublisher?: string; // Publicador / Conductor que reportó dónde quedó
  createdAt: string;
}

export interface TerritoryHistoryRecord {
  id: string;
  territoryId: string;
  territoryNumber: string;
  congregationId: string;
  assignedToId: string;
  assignedToName: string;
  assignedDate: string;
  completedDate?: string;
  notes?: string;
}

export type PreachingActivityType =
  | 'TERRITORIO'
  | 'RURAL'
  | 'CALLES'
  | 'ZOOM'
  | 'CARTAS'
  | 'GIRA';

export interface WeeklyAssignment {
  id: string;
  congregationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  activityType?: PreachingActivityType; // Modalidad: Territorio, Rural, Calles, Zoom, Cartas
  placeId: string;
  placeName: string;
  leaderId: string;
  leaderName: string;
  territoryId?: string;
  territoryNumber?: string;
  notes?: string;
  hasConflict?: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface PublicPreachingPlace {
  id: string;
  congregationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  time: string; // HH:mm
  duration: number; // minutos, ej: 60, 90, 120
  description?: string;
  active: boolean;
  fixedMemberIds: string[]; // Participantes fijos asignados a este punto
  createdAt: string;
}

export interface PublicParticipant {
  userId: string;
  userName: string;
  isFixed?: boolean;
}

export interface PublicPreachingAssignment {
  id: string;
  congregationId: string;
  placeId: string;
  placeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutos
  participants: PublicParticipant[]; // Obligatoriamente entre 2 y 3 participantes
  notes?: string;
  createdAt: string;
}

export interface NotificationPreference {
  userId: string;
  congregationId: string;
  remind7Days: boolean;
  remind2Days: boolean;
  remindSameDay7Am: boolean;
  fcmToken?: string;
}

export interface AuditLog {
  id: string;
  congregationId: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  timestamp: string;
}

export interface CongregationBackupData {
  version: string;
  exportedAt: string;
  congregation: Congregation;
  users: UserProfile[];
  preachingPlaces: PreachingPlace[];
  territories: Territory[];
  territoryHistory: TerritoryHistoryRecord[];
  weeklyAssignments: WeeklyAssignment[];
  publicPlaces: PublicPreachingPlace[];
  publicAssignments: PublicPreachingAssignment[];
  auditLogs: AuditLog[];
}

export type ViewTab =
  | 'inicio'
  | 'mi_congregacion'
  | 'programa'
  | 'calendario'
  | 'territorios'
  | 'lugares'
  | 'publica'
  | 'publicadores'
  | 'configuracion'
  | 's21_tarjetas'
  | 'informes'
  | 'datos_congregacion'
  | 'auditoria'
  | 'neon_consola';

export interface S21Record {
  id: string;
  user_id?: string;
  publisher_id?: string;
  service_year: string;
  month_number: number;
  calendar_year: number;
  shared_in_ministry: boolean;
  bible_courses: number;
  auxiliary_pioneer: boolean;
  hours: number | null;
  notes?: string | null;
}

export interface MonthlyBreakdown {
  month_number: number;
  month_name: string;
  calendar_year: number;
  total_publishers_on_file: number;
  publishers_reporting_activity: number;
  auxiliary_pioneers_count: number;
  total_bible_courses: number;
  total_hours: number;
}

export interface PublisherSummaryItem {
  user_id?: string;
  publisher_id?: string;
  first_name: string;
  last_name: string;
  service_group: number;
  status: string;
  is_elder: boolean;
  is_ministerial_servant: boolean;
  is_regular_pioneer: boolean;
  months_participated: number;
  total_hours: number;
  avg_monthly_hours: string;
  total_bible_courses: number;
  months_auxiliary_pioneer: number;
}

export interface ServiceYearReport {
  service_year: string;
  congregation_id: string;
  total_publishers: number;
  total_hours: number;
  total_bible_courses: number;
  monthly_breakdown: MonthlyBreakdown[];
  publishers_summary: PublisherSummaryItem[];
}

export interface DbStatusResponse {
  status: string;
  engine: string;
  database?: string;
  version?: string;
  totals: {
    congregations: number;
    publishers: number;
    s21_records: number;
    locations: number;
    activities: number;
  };
}


