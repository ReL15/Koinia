/**
 * Contexto de Autenticación y Perfil de Usuario
 * Conectado a Firebase Authentication (correo y contraseña) y PostgreSQL.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, Congregation } from '../types';
import {
  auth,
  firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from '../lib/firebase';
import {
  apiService,
  getActiveCongregationId,
  setActiveCongregationId,
} from '../services/apiService';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  isMasterAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  activeCongregationId: string;
  availableCongregations: Congregation[];
  isBootstrapAdmin: boolean;
  hasCongregation: boolean;
  switchCongregation: (congregationId: string) => Promise<void>;
  refreshCongregations: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithDirectEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    name: string,
    congregationId: string
  ) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<void>;
  resetPasswordDirect: (email: string, newPass: string) => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUserProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('teocratic_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isBootstrapAdmin, setIsBootstrapAdmin] = useState<boolean>(() => Boolean(currentUser?.isMasterAdmin));
  const [hasCongregation, setHasCongregation] = useState<boolean>(() => Boolean(currentUser?.congregationId));
  const [activeCongregationId, setActiveCongIdState] = useState<string>(() =>
    getActiveCongregationId() || currentUser?.congregationId || ''
  );
  const [availableCongregations, setAvailableCongregations] = useState<Congregation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => !currentUser);
  const [error, setError] = useState<string | null>(null);
  const isRegistering = useRef(false);

  useEffect(() => {
    // Si ya hay usuario en sesión directa de PostgreSQL, cargar congregaciones y omitir bloqueo
    if (currentUser) {
      apiService
        .getCongregationsList()
        .then((congs) => {
          setAvailableCongregations(congs);
          if (currentUser.congregationId) {
            setActiveCongIdState(currentUser.congregationId);
            setActiveCongregationId(currentUser.congregationId);
          } else if (congs.length > 0) {
            setActiveCongIdState(congs[0].id);
            setActiveCongregationId(congs[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
      return;
    }

    // Escuchar cambios de autenticación de Firebase si no hay sesión local
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && isRegistering.current) return;
      setIsLoading(true);
      setError(null);
      if (user && user.email) {
        try {
          const profile = await apiService.syncAuthUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || undefined,
          });
          setCurrentUser(profile);
          setIsBootstrapAdmin(Boolean(profile.isMasterAdmin));
          setHasCongregation(Boolean(profile.congregationId));

          const congId = getActiveCongregationId() || profile.congregationId;
          if (congId) {
            setActiveCongIdState(congId);
            setActiveCongregationId(congId);
          }

          const congs = await apiService.getCongregationsList();
          setAvailableCongregations(congs);
        } catch (err: any) {
          console.error('Error sincronizando perfil de usuario:', err);
          setCurrentUser(null);
          setIsBootstrapAdmin(false);
          setHasCongregation(false);
          setError(err.message || 'Error al sincronizar con la base de datos.');
        } finally {
          setIsLoading(false);
        }
      } else {
        const stored = localStorage.getItem('teocratic_user_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCurrentUser(parsed);
            setIsBootstrapAdmin(Boolean(parsed.isMasterAdmin));
            setHasCongregation(Boolean(parsed.congregationId));
            const congId = getActiveCongregationId() || parsed.congregationId;
            if (congId) {
              setActiveCongIdState(congId);
              setActiveCongregationId(congId);
            }
            apiService.getCongregationsList().then(setAvailableCongregations).catch(console.error);
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
          setIsBootstrapAdmin(false);
          setHasCongregation(false);
          setAvailableCongregations([]);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const switchCongregation = async (congId: string) => {
    setActiveCongIdState(congId);
    setActiveCongregationId(congId);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        congregationId: congId,
      });
    }
  };

  const refreshCongregations = async () => {
    try {
      const list = await apiService.getCongregationsList();
      setAvailableCongregations(list);
    } catch (e) {
      console.error('Error actualizando lista de congregaciones:', e);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const { profile } = await apiService.getMyProfile();
      if (profile) {
        setCurrentUser(profile);
        setIsBootstrapAdmin(Boolean(profile.isMasterAdmin));
        setHasCongregation(Boolean(profile.congregationId));
      }
    } catch (err) {
      console.error('Error al recargar perfil:', err);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user.email) {
        const profile = await apiService.syncAuthUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || undefined,
        });
        setCurrentUser(profile);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con correo:', err);
      setError(err.message || 'Credenciales inválidas.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    congregationId: string
  ) => {
    setIsLoading(true);
    setError(null);
    isRegistering.current = true;
    try {
      try {
        const res = await apiService.directRegister({
          email,
          password: pass,
          fullName: name,
          congregationId,
        });
        localStorage.setItem('teocratic_user_session', JSON.stringify(res.user));
        setCurrentUser(res.user);
        setIsBootstrapAdmin(Boolean(res.user.isMasterAdmin));
        setHasCongregation(Boolean(res.user.congregationId));
        if (res.user.congregationId) {
          setActiveCongIdState(res.user.congregationId);
          setActiveCongregationId(res.user.congregationId);
        }
        await refreshCongregations();
        return;
      } catch (directErr: any) {
        if (directErr.message && !directErr.message.includes('fetch') && !directErr.message.includes('Failed')) {
          throw directErr;
        }
      }

      let result;
      try {
        result = await createUserWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err?.code !== 'auth/email-already-in-use') throw err;
        result = await signInWithEmailAndPassword(auth, email, pass);
      }
      if (result.user.email) {
        const profile = await apiService.syncAuthUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          congregationId,
        });
        setCurrentUser(profile);
        setIsBootstrapAdmin(Boolean(profile.isMasterAdmin));
        setHasCongregation(Boolean(profile.congregationId));
        setActiveCongIdState(profile.congregationId);
        setActiveCongregationId(profile.congregationId);
        await refreshCongregations();
      }
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);
      setError(err.message || 'Error al crear la cuenta.');
      throw err;
    } finally {
      isRegistering.current = false;
      setIsLoading(false);
    }
  };

  const requestPasswordRecovery = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Ignorar si Firebase no está configurado
    }
  };

  const resetPasswordDirect = async (email: string, newPass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.directResetPassword(email, newPass);
      localStorage.setItem('teocratic_user_session', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setIsBootstrapAdmin(Boolean(res.user.isMasterAdmin));
      setHasCongregation(Boolean(res.user.congregationId));
      if (res.user.congregationId) {
        setActiveCongIdState(res.user.congregationId);
        setActiveCongregationId(res.user.congregationId);
      }
      await refreshCongregations();
      return res.user;
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      setError(err.message || 'Error al restablecer contraseña.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('Inicia sesión nuevamente para cambiar tu contraseña.');
    }
    if (!user.providerData.some((provider) => provider.providerId === 'password')) {
      throw new Error(
        'Esta cuenta no tiene habilitado el acceso con correo y contraseña. Usa la recuperación de contraseña o contacta al administrador.'
      );
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  const loginWithDirectEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.directLogin(email, password);

      localStorage.setItem('teocratic_user_session', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setIsBootstrapAdmin(Boolean(res.user.isMasterAdmin));
      setHasCongregation(Boolean(res.user.congregationId));
      if (res.user.congregationId) {
        setActiveCongIdState(res.user.congregationId);
        setActiveCongregationId(res.user.congregationId);
      }
      await refreshCongregations();
    } catch (err: any) {
      console.error('Error al iniciar sesión con PostgreSQL:', err);
      setError(err.message || 'Error al iniciar sesión con la base de datos.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    localStorage.removeItem('teocratic_user_session');
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignorar
    }
    setCurrentUser(null);
    setActiveCongregationId('');
    setActiveCongIdState('');
    setIsLoading(false);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        isMasterAdmin: Boolean(currentUser?.isMasterAdmin || isBootstrapAdmin),
        isLoading,
        error,
        activeCongregationId,
        availableCongregations,
        isBootstrapAdmin,
        hasCongregation,
        switchCongregation,
        refreshCongregations,
        loginWithEmail,
        loginWithDirectEmail,
        registerWithEmail,
        requestPasswordRecovery,
        resetPasswordDirect,
        changePassword,
        logout,
        clearError,
        refreshUserProfile,
      }}

    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
