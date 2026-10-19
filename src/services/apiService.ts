/**
 * Servicio unificado de acceso a datos para el Organizador de la Predicación Congregacional
 * Conectado directamente a la base de datos relacional PostgreSQL a través de la API del servidor.
 */

import {
  Congregation,
  UserProfile,
  PreachingPlace,
  Territory,
  TerritoryHistoryRecord,
  WeeklyAssignment,
  PublicPreachingPlace,
  PublicPreachingAssignment,
  AuditLog,
  CongregationBackupData,
  S21Record,
  ServiceYearReport,
  DbStatusResponse,
  ServiceGroup,
} from '../types';

import { validatePublicPreachingParticipants } from './securityRules';
import { auth } from '../lib/firebase';

const ACTIVE_CONGREGATION_KEY = 'opc_active_congregation_id';

export interface CongregationFullData {
  congregation: Congregation;
  users: UserProfile[];
  preachingPlaces: PreachingPlace[];
  territories: Territory[];
  territoryHistory: TerritoryHistoryRecord[];
  weeklyAssignments: WeeklyAssignment[];
  publicPlaces: PublicPreachingPlace[];
  publicAssignments: PublicPreachingAssignment[];
  auditLogs: AuditLog[];
  serviceGroups: ServiceGroup[];
}

export function getActiveCongregationId(): string {
  return localStorage.getItem(ACTIVE_CONGREGATION_KEY) || '';
}

export function setActiveCongregationId(id: string): void {
  if (id) {
    localStorage.setItem(ACTIVE_CONGREGATION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONGREGATION_KEY);
  }
}

/**
 * Cliente HTTP autenticado hacia los endpoints PostgreSQL de la aplicación
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // Si hay usuario autenticado en Firebase, agregar ID Token
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // Ignorar error al extraer token
    }
  } else {
    // Si hay sesión directa de PostgreSQL, usar el ID de usuario como token
    try {
      const stored = localStorage.getItem('teocratic_user_session');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.id) headers.set('Authorization', `Bearer ${u.id}`);
      }
    } catch {
      // Ignorar error de parsing
    }
  }


  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMessage = errJson.error;
    } catch {
      // Usar status text
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const apiService = {
  getActiveCongregationId,
  setActiveCongregationId,

  /**
   * Obtiene el perfil del usuario actual desde la base de datos
   */
  async getMyProfile(): Promise<{
    profile: UserProfile | null;
    isBootstrapAdmin: boolean;
    hasCongregation: boolean;
  }> {
    try {
      const profile = await apiFetch<UserProfile>('/api/me');
      return {
        profile,
        isBootstrapAdmin: Boolean(profile?.isMasterAdmin),
        hasCongregation: Boolean(profile?.congregationId),
      };
    } catch {
      return {
        profile: null,
        isBootstrapAdmin: false,
        hasCongregation: false,
      };
    }
  },

  /**
   * Sincroniza el usuario de Firebase Auth con la tabla PostgreSQL
   */
  async syncAuthUser(userData: {
    uid: string;
    email: string;
    displayName?: string;
    congregationId?: string;
  }): Promise<UserProfile> {
    return apiFetch<UserProfile>('/api/auth/sync', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Lista todas las congregaciones en la base de datos
   */
  async getCongregationsList(): Promise<Congregation[]> {
    return apiFetch<Congregation[]>('/api/congregations');
  },

  /**
   * Crea una nueva congregación
   */
  async createCongregation(
    newCong: { name: string; circuit?: string; city?: string; timezone: string },
    _currentUser: UserProfile
  ): Promise<Congregation> {
    const created = await apiFetch<Congregation>('/api/congregations', {
      method: 'POST',
      body: JSON.stringify(newCong),
    });
    if (created.id) {
      setActiveCongregationId(created.id);
    }
    return created;
  },

  /**
   * Obtiene la totalidad de datos operativos para la congregación activa
   */
  async getCongregationData(targetCongregationId?: string): Promise<CongregationFullData> {
    const activeId = targetCongregationId || getActiveCongregationId();

    const [allCongs, users, preachingPlaces, territories, territoryHistory, weeklyAssignments, publicPlaces, publicAssignments, auditLogs, serviceGroups] =
      await Promise.all([
        apiFetch<Congregation[]>('/api/congregations'),
        apiFetch<UserProfile[]>(`/api/users?congregationId=${activeId}`),
        apiFetch<PreachingPlace[]>(`/api/places?congregationId=${activeId}`),
        apiFetch<Territory[]>(`/api/territories?congregationId=${activeId}`),
        apiFetch<TerritoryHistoryRecord[]>(`/api/territories/history?congregationId=${activeId}`),
        apiFetch<WeeklyAssignment[]>(`/api/weekly-assignments?congregationId=${activeId}`),
        apiFetch<PublicPreachingPlace[]>(`/api/public-places?congregationId=${activeId}`),
        apiFetch<PublicPreachingAssignment[]>(`/api/public-assignments?congregationId=${activeId}`),
        apiFetch<AuditLog[]>(`/api/audit-logs?congregationId=${activeId}`),
        apiFetch<ServiceGroup[]>(`/api/service-groups?congregationId=${activeId}`),
      ]);

    const congregation = allCongs.find((c) => c.id === activeId) ||
      allCongs[0] || {
        id: activeId || 'cong-1',
        name: 'Congregación',
        timezone: 'America/El_Salvador',
        createdAt: new Date().toISOString(),
      };

    return {
      congregation,
      users,
      preachingPlaces,
      territories,
      territoryHistory,
      weeklyAssignments,
      publicPlaces,
      publicAssignments,
      auditLogs,
      serviceGroups: serviceGroups || [],
    };
  },

  /**
   * Guarda o actualiza una asignación semanal
   */
  async saveWeeklyAssignment(
    assignment: WeeklyAssignment,
    currentUser: UserProfile
  ): Promise<WeeklyAssignment> {
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const isEdit = Boolean(assignment.id && !assignment.id.startsWith('temp_'));

    if (isEdit) {
      return apiFetch<WeeklyAssignment>(`/api/weekly-assignments/${assignment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...assignment, congregationId: activeId }),
      });
    } else {
      return apiFetch<WeeklyAssignment>('/api/weekly-assignments', {
        method: 'POST',
        body: JSON.stringify({ ...assignment, congregationId: activeId }),
      });
    }
  },

  /**
   * Elimina una reunión semanal de predicación
   */
  async deleteWeeklyAssignment(assignmentId: string, _currentUser: UserProfile): Promise<void> {
    await apiFetch(`/api/weekly-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Guarda un turno de predicación pública (valida de 2 a 3 publicadores)
   */
  async savePublicAssignment(
    assignment: PublicPreachingAssignment,
    currentUser: UserProfile
  ): Promise<PublicPreachingAssignment> {
    const validation = validatePublicPreachingParticipants(assignment.participants);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const isEdit = Boolean(assignment.id && !assignment.id.startsWith('temp_'));

    if (isEdit) {
      return apiFetch<PublicPreachingAssignment>(`/api/public-assignments/${assignment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...assignment, congregationId: activeId }),
      });
    } else {
      return apiFetch<PublicPreachingAssignment>('/api/public-assignments', {
        method: 'POST',
        body: JSON.stringify({ ...assignment, congregationId: activeId }),
      });
    }
  },

  /**
   * Elimina un turno de predicación pública
   */
  async deletePublicAssignment(assignmentId: string, _currentUser: UserProfile): Promise<void> {
    await apiFetch(`/api/public-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Guarda o actualiza un territorio
   */
  async saveTerritory(territory: Territory, currentUser: UserProfile): Promise<Territory> {
    if (!territory.number.trim()) {
      throw new Error('El número del territorio es obligatorio.');
    }
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const isEdit = Boolean(territory.id && !territory.id.startsWith('temp_'));

    if (isEdit) {
      return apiFetch<Territory>(`/api/territories/${territory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...territory, congregationId: activeId }),
      });
    } else {
      return apiFetch<Territory>('/api/territories', {
        method: 'POST',
        body: JSON.stringify({ ...territory, congregationId: activeId }),
      });
    }
  },

  /**
   * Registra el avance de predicación de un territorio (dónde quedó)
   */
  async recordTerritoryProgress(
    territory: Territory,
    progressData: {
      progress: string;
      date: string;
      publisherName: string;
      notes?: string;
      status?: Territory['status'];
    },
    currentUser: UserProfile
  ): Promise<Territory> {
    const updatedTerritory: Territory = {
      ...territory,
      lastProgress: progressData.progress.trim(),
      lastProgressDate: progressData.date,
      lastProgressPublisher: progressData.publisherName.trim(),
      status: progressData.status || territory.status,
      observations: progressData.notes?.trim()
        ? (territory.observations ? `${territory.observations} · ${progressData.notes.trim()}` : progressData.notes.trim())
        : territory.observations,
    };

    return this.saveTerritory(updatedTerritory, currentUser);
  },

  /**
   * Guarda o actualiza un lugar de salida
   */
  async savePreachingPlace(
    place: PreachingPlace,
    currentUser: UserProfile
  ): Promise<PreachingPlace> {
    if (!place.name.trim()) {
      throw new Error('El nombre del punto de salida es obligatorio.');
    }
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const isEdit = Boolean(place.id && !place.id.startsWith('temp_'));

    if (isEdit) {
      return apiFetch<PreachingPlace>(`/api/places/${place.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...place, congregationId: activeId }),
      });
    } else {
      return apiFetch<PreachingPlace>('/api/places', {
        method: 'POST',
        body: JSON.stringify({ ...place, congregationId: activeId }),
      });
    }
  },

  /**
   * Guarda o actualiza un punto fijo de predicación pública
   */
  async savePublicPlace(
    place: PublicPreachingPlace,
    currentUser: UserProfile
  ): Promise<PublicPreachingPlace> {
    if (!place.name.trim()) {
      throw new Error('El nombre del punto de predicación pública es obligatorio.');
    }
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const isEdit = Boolean(place.id && !place.id.startsWith('temp_'));

    if (isEdit) {
      return apiFetch<PublicPreachingPlace>(`/api/public-places/${place.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...place, congregationId: activeId }),
      });
    } else {
      return apiFetch<PublicPreachingPlace>('/api/public-places', {
        method: 'POST',
        body: JSON.stringify({ ...place, congregationId: activeId }),
      });
    }
  },

  /**
   * Guarda o actualiza un publicador en la base de datos
   */
  async saveUserProfile(user: UserProfile, currentUser: UserProfile): Promise<UserProfile> {
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const isEdit = Boolean(user.id && !user.id.startsWith('temp_'));

    if (isEdit) {
      const { createdAt, ...userData } = user;
      return apiFetch<UserProfile>(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...userData, congregationId: activeId }),
      });
    } else {
      return apiFetch<UserProfile>('/api/users', {
        method: 'POST',
        body: JSON.stringify({ ...user, congregationId: activeId }),
      });
    }
  },

  async deleteUserProfile(userId: string): Promise<void> {
    await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
  },

  async bulkImportPublishers(
    publishers: Array<Partial<UserProfile & { password?: string }>>,
    congregationId: string
  ): Promise<{ success: boolean; count: number; inserted: number; updated: number }> {
    return apiFetch('/api/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ congregationId, publishers }),
    });
  },

  /**
   * Actualiza ajustes de la congregación
   */
  async updateCongregationSettings(
    settings: Partial<Congregation>,
    currentUser: UserProfile
  ): Promise<Congregation> {
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    return apiFetch<Congregation>(`/api/congregations/${activeId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  /**
   * Genera el respaldo JSON de la congregación desde PostgreSQL
   */
  async exportBackup(currentUser: UserProfile): Promise<CongregationBackupData> {
    const activeId = getActiveCongregationId() || currentUser.congregationId;
    const fullData = await this.getCongregationData(activeId);

    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      congregation: fullData.congregation,
      users: fullData.users,
      preachingPlaces: fullData.preachingPlaces,
      territories: fullData.territories,
      territoryHistory: fullData.territoryHistory,
      weeklyAssignments: fullData.weeklyAssignments,
      publicPlaces: fullData.publicPlaces,
      publicAssignments: fullData.publicAssignments,
      auditLogs: fullData.auditLogs,
    };
  },

  /**
   * Métodos del Módulo Ministerial (Fichas S-21 e Informes)
   */
  async getDbStatus(): Promise<DbStatusResponse> {
    return apiFetch<DbStatusResponse>('/api/db-status');
  },

  async getS21Records(userId: string, serviceYear: string = '2024-2025'): Promise<S21Record[]> {
    const res = await apiFetch<{ data: S21Record[] }>(
      `/api/s21/records?user_id=${encodeURIComponent(userId)}&service_year=${encodeURIComponent(serviceYear)}`
    );
    return res.data;
  },

  async saveS21Record(data: Partial<S21Record>): Promise<S21Record> {
    const res = await apiFetch<{ data: S21Record }>('/api/s21/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getServiceYearReport(serviceYear: string = '2024-2025'): Promise<ServiceYearReport> {
    const activeId = getActiveCongregationId();
    const res = await apiFetch<{ data: ServiceYearReport }>(
      `/api/reports/service-year?service_year=${encodeURIComponent(serviceYear)}&congregation_id=${encodeURIComponent(activeId)}`
    );
    return res.data;
  },

  getCsvExportUrl(serviceYear: string = '2024-2025'): string {
    const activeId = getActiveCongregationId();
    return `/api/reports/service-year?service_year=${encodeURIComponent(serviceYear)}&format=csv&congregation_id=${encodeURIComponent(activeId)}`;
  },

  async getUsersList(): Promise<Array<{ id: string; email: string; full_name: string; role: string; congregation_name: string; congregation_id: string }>> {
    const res = await apiFetch<{ data: any[] }>('/api/auth/users-list');
    return res.data;
  },

  async directLogin(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return apiFetch<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async directRegister(data: {
    email: string;
    password: string;
    fullName: string;
    congregationId: string;
    role?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    return apiFetch<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async directResetPassword(email: string, newPassword: string): Promise<{ user: UserProfile; token: string }> {
    return apiFetch<{ user: UserProfile; token: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  async adminResetPassword(userId: string, newPassword: string): Promise<void> {
    await apiFetch('/api/auth/admin-reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, newPassword }),
    });
  },

  async getServiceGroups(congregationId?: string): Promise<ServiceGroup[]> {
    const activeId = congregationId || getActiveCongregationId();
    return apiFetch<ServiceGroup[]>(`/api/service-groups?congregationId=${activeId}`);
  },

  async saveServiceGroup(group: {
    congregationId: string;
    groupNumber: number;
    name?: string;
    overseerId?: string;
    assistantId?: string;
    meetingPlace?: string;
  }): Promise<ServiceGroup> {
    return apiFetch<ServiceGroup>('/api/service-groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  },

  /**
   * Métodos para el Formulario Público de Informe Mensual (Sin inicio de sesión)
   */
  async getPublisherByPhone(phone: string): Promise<{ found: boolean; publisher?: PublicPublisherInfo; message?: string }> {
    return apiFetch<{ found: boolean; publisher?: PublicPublisherInfo; message?: string }>(
      `/api/public/publisher-by-phone?phone=${encodeURIComponent(phone)}`
    );
  },

  async getPublicReportStatus(
    userId: string,
    serviceYear: string,
    monthNumber: number
  ): Promise<{ exists: boolean; record?: Partial<S21Record> | null }> {
    return apiFetch<{ exists: boolean; record?: Partial<S21Record> | null }>(
      `/api/public/report-status?user_id=${encodeURIComponent(userId)}&service_year=${encodeURIComponent(
        serviceYear
      )}&month_number=${encodeURIComponent(monthNumber)}`
    );
  },

  async submitPublicReport(
    payload: PublicSubmitReportPayload
  ): Promise<{ success: boolean; message: string; data?: S21Record }> {
    return apiFetch<{ success: boolean; message: string; data?: S21Record }>('/api/public/submit-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export interface PublicPublisherInfo {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  serviceGroup: number;
  role: string;
  roles?: string[];
  isRegularPioneer: boolean;
  isAuxiliaryPioneer: boolean;
  congregationName: string;
  congregationId: string;
}

export interface PublicSubmitReportPayload {
  userId: string;
  phone: string;
  serviceYear: string;
  monthNumber: number;
  sharedInMinistry: boolean;
  auxiliaryPioneer: boolean;
  hours?: number | null;
  bibleCourses: number;
  notes?: string | null;
}



