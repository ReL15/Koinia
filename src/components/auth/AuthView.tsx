import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Congregation } from '../../types';
import logo from '../../lib/logo.svg';
import { Button } from '../common/Button';
import { Lock, Mail, User, FileSpreadsheet } from 'lucide-react';

interface AuthViewProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenPublicReport?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  isModal = false,
  isOpen = true,
  onClose,
  onOpenPublicReport,
}) => {
  const {
    loginWithEmail,
    loginWithDirectEmail,
    registerWithEmail,
    requestPasswordRecovery,
    resetPasswordDirect,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [congregationSearch, setCongregationSearch] = useState('');
  const [selectedCongregation, setSelectedCongregation] = useState<Congregation | null>(null);
  const [isLoadingCongregations, setIsLoadingCongregations] = useState(false);
  const [congregationError, setCongregationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<Array<{ id: string; email: string; full_name: string; role: string }>>([]);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  useEffect(() => {
    apiService.getUsersList()
      .then((list) => setRegisteredUsers(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'register') return;

    let isCurrent = true;
    setIsLoadingCongregations(true);
    setCongregationError('');
    apiService.getCongregationsList()
      .then((list) => {
        if (isCurrent) {
          setCongregations(list);
          if (list.length > 0 && !selectedCongregation) {
            setSelectedCongregation(list[0]);
            setCongregationSearch(list[0].name);
          }
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setCongregationError(err.message || 'No se pudieron cargar las congregaciones.');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingCongregations(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [mode]);

  if (isModal && !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (mode === 'login' && (!cleanEmail || !cleanPassword)) {
      setMessage({
        type: 'error',
        text: 'Debes ingresar tu correo electrónico y tu contraseña obligatoriamente.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        try {
          // Validar con la base de datos Neon PostgreSQL
          await loginWithDirectEmail(cleanEmail, cleanPassword);
          if (onClose) onClose();
          return;
        } catch (directErr: any) {
          if (directErr.message && !directErr.message.includes('fetch')) {
            throw directErr;
          }
          // Si falla conexión, probar con Firebase si estuviera activo
          try {
            await loginWithEmail(cleanEmail, cleanPassword);
            if (onClose) onClose();
            return;
          } catch {
            throw directErr;
          }
        }
      } else if (mode === 'register') {
        if (!fullName.trim()) throw new Error('Ingresa tu nombre completo.');
        if (!selectedCongregation) throw new Error('Busca y selecciona tu congregación.');
        await registerWithEmail(cleanEmail, cleanPassword, fullName, selectedCongregation.id);
        if (onClose) onClose();
      } else if (mode === 'recovery') {
        if (!cleanEmail) throw new Error('Ingresa tu correo electrónico.');
        if (!cleanPassword) throw new Error('Ingresa tu nueva contraseña.');
        if (cleanPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
        if (cleanPassword !== confirmPassword.trim()) throw new Error('Las contraseñas no coinciden.');
        await resetPasswordDirect(cleanEmail, cleanPassword);
        setMessage({
          type: 'success',
          text: '¡Contraseña restablecida correctamente! Sesión iniciada.',
        });
        if (onClose) onClose();
      }
    } catch (err: any) {

      const firebaseCode = err?.code;
      const errorMessage =
        firebaseCode === 'auth/invalid-credential' ||
        firebaseCode === 'auth/wrong-password' ||
        firebaseCode === 'auth/user-not-found'
          ? 'El correo o la contraseña no son correctos.'
          : firebaseCode === 'auth/operation-not-allowed'
          ? 'El acceso con correo y contraseña no está habilitado en Firebase Authentication.'
          : firebaseCode === 'auth/too-many-requests'
          ? 'Hubo demasiados intentos. Espera un momento e inténtalo de nuevo.'
          : firebaseCode === 'auth/network-request-failed'
          ? 'No se pudo conectar con el servicio de inicio de sesión. Revisa tu conexión e inténtalo de nuevo.'
          : err.message || 'Error durante la autenticación.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };


  const cardContent = (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white mb-3">
          <img src={logo} alt="Logotipo del sistema" className="w-full h-full rounded-xl" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {mode === 'login'
            ? 'Koinia - Sistema de Gestion'
            : mode === 'register'
            ? 'Crear Cuenta'
            : 'Recuperar Contraseña'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {mode === 'login'
            ? 'Acceso para publicadores y coordinadores de congregación'
            : mode === 'register'
            ? 'Crea tu cuenta como publicador y selecciona tu congregación'
            : 'Introduce tu correo para restablecer la clave'}
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 text-xs rounded-lg border ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre y Apellido <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Congregación <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={congregationSearch}
                onChange={(event) => {
                  setCongregationSearch(event.target.value);
                  setSelectedCongregation(null);
                  setCongregationError('');
                }}
                placeholder={isLoadingCongregations ? 'Cargando congregaciones...' : 'Escribe el nombre de tu congregación'}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={Boolean(congregationSearch && !selectedCongregation)}
                aria-controls="congregation-options"
                disabled={isLoadingCongregations || Boolean(congregationError)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
              {selectedCongregation && (
                <p className="mt-1 text-xs text-emerald-700" role="status">
                  Congregación seleccionada: {selectedCongregation.name}
                </p>
              )}
              {congregationError && (
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-rose-700" role="alert">
                  <span>{congregationError}</span>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-semibold underline"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              )}
              {!selectedCongregation && congregationSearch.trim() && !isLoadingCongregations && !congregationError && (
                <ul id="congregation-options" role="listbox" className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  {congregations
                    .filter((congregation) =>
                      congregation.name.toLocaleLowerCase().includes(congregationSearch.trim().toLocaleLowerCase())
                    )
                    .map((congregation) => (
                      <li key={congregation.id} role="option" aria-selected={false}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCongregation(congregation);
                            setCongregationSearch(congregation.name);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50"
                        >
                          {congregation.name}
                          {congregation.city && <span className="ml-1 text-slate-400">· {congregation.city}</span>}
                        </button>
                      </li>
                    ))}
                  {congregations.every(
                    (congregation) =>
                      !congregation.name.toLocaleLowerCase().includes(congregationSearch.trim().toLocaleLowerCase())
                  ) && (
                    <li className="px-3 py-2 text-xs text-slate-500">
                      No hay congregaciones que coincidan con la búsqueda.
                    </li>
                  )}
                </ul>
              )}
              {!isLoadingCongregations && !congregationError && congregations.length === 0 && (
                <p className="mt-1 text-xs text-rose-700" role="alert">
                  No hay congregaciones disponibles para registrarse.
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Correo Electrónico <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.correo@ejemplo.org"
              autoComplete="email"
              required
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {mode !== 'recovery' ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Contraseña <span className="text-rose-500">*</span>
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('recovery');
                    setMessage(null);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nueva Contraseña <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </>
        )}

        <Button type="submit" size="sm" className="w-full mt-2" isLoading={isLoading}>
          {mode === 'login'
            ? 'Iniciar Sesión'
            : mode === 'register'
            ? 'Crear Cuenta'
            : 'Restablecer Contraseña e Iniciar Sesión'}
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
        {mode === 'recovery' ? (
          <div>
            ¿Recordaste tu contraseña?{' '}
            <button
              onClick={() => {
                setMode('login');
                setMessage(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="font-semibold text-slate-900 hover:underline cursor-pointer"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        ) : mode === 'login' ? (
          <div>
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => {
                setMode('register');
                setMessage(null);
                setCongregationSearch('');
                setSelectedCongregation(null);
              }}
              className="font-semibold text-slate-900 hover:underline cursor-pointer"
            >
              Registrarse
            </button>
          </div>
        ) : (
          <div>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className="font-semibold text-slate-900 hover:underline cursor-pointer"
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </div>

      {/* Acceso directo al formulario público de informe sin contraseña */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            if (onOpenPublicReport) {
              onOpenPublicReport();
            } else {
              window.location.search = '?view=informe';
            }
          }}
          className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Enviar Informe de Predicación (Sin contraseña)</span>
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
      >
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">{cardContent}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {cardContent}
    </div>
  );
};
