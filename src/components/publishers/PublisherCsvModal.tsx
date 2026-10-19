import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiService } from '../../services/apiService';
import { UserRole } from '../../types';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, Users, X } from 'lucide-react';

interface PublisherCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  congregationId: string;
  onImportSuccess: (count: number) => void;
}

interface ParsedPublisher {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  roles: UserRole[];
  canLeadPreaching: boolean;
  canPublicPreaching: boolean;
  password?: string;
  isValid: boolean;
  isGeneratedEmail?: boolean;
  error?: string;
}

export const PublisherCsvModal: React.FC<PublisherCsvModalProps> = ({
  isOpen,
  onClose,
  congregationId,
  onImportSuccess,
}) => {
  const [parsedList, setParsedList] = useState<ParsedPublisher[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent =
      'Nombre Completo,Correo,Telefono,Roles,Dirige Salidas,Predicacion Publica,Contraseña\n' +
      '"Jorge Rivera Lue","jorge.rivera@ejemplo.org","+503 7000-0000","COORDINADOR,ANCIANO","SI","SI","password123"\n' +
      '"Alicia Lue de Rivera","alicia.lue@ejemplo.org","+503 7111-1111","PRECURSOR_REGULAR,PUBLICADOR","NO","SI","password123"\n' +
      '"Isaac Vallecillo","isaac.v@ejemplo.org","+503 7222-2222","SIERVO_MINISTERIAL,PUBLICADOR","SI","SI","password123"\n' +
      '"Hermano Ejemplo","publicador@ejemplo.org","","PUBLICADOR","NO","SI","password123"';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_publicadores_congregacion.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    // 1. Quitar BOM de UTF-8 si está presente
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    if (!cleanText) {
      setErrorMessage('El archivo CSV está vacío.');
      return;
    }

    // 2. Detectar delimitador (coma, punto y coma o tabulación) según una muestra amplia del archivo
    const sample = cleanText.slice(0, 4000);
    const countChar = (str: string, ch: string) => str.split(ch).length - 1;
    const commas = countChar(sample, ',');
    const semicolons = countChar(sample, ';');
    const tabs = countChar(sample, '\t');

    let delimiter = ',';
    if (semicolons > commas && semicolons > tabs) {
      delimiter = ';';
    } else if (tabs > commas && tabs > semicolons) {
      delimiter = '\t';
    }

    // 3. Tokenizador estándar compatible con comillas escapadas "" y delimitadores entre comillas
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const ch = cleanText[i];
      const nextCh = cleanText[i + 1];

      if (ch === '"') {
        if (insideQuotes && nextCh === '"') {
          currentField += '"';
          i++; // saltar comilla escapada
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (ch === delimiter && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((ch === '\r' || ch === '\n') && !insideQuotes) {
        if (ch === '\r' && nextCh === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += ch;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length <= 1) {
      setErrorMessage('El archivo CSV está vacío o solo contiene encabezados.');
      return;
    }

    // 4. Normalizar encabezados (quitar acentos y convertir a minúsculas)
    const normalizeHeader = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    // Buscar la fila de encabezados en las primeras 5 filas (en caso de que el archivo tenga títulos iniciales)
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(5, rows.length); r++) {
      const candidateHeaders = rows[r].map((h) => h.replace(/^"(.*)"$/, '$1').trim()).map(normalizeHeader);
      const hasKeywords = candidateHeaders.some((h) =>
        ['nombre', 'name', 'publicador', 'hermano', 'persona', 'usuario', 'apellido', 'apellidos'].some((k) =>
          h.includes(k)
        )
      );
      if (hasKeywords) {
        headerRowIdx = r;
        break;
      }
    }
    if (headerRowIdx === -1) headerRowIdx = 0;

    const rawHeaders = rows[headerRowIdx].map((h) => h.replace(/^"(.*)"$/, '$1').trim());
    const headers = rawHeaders.map(normalizeHeader);

    const findIndex = (keywords: string[]): number => {
      return headers.findIndex((h) =>
        keywords.some((k) => h === k || h.includes(k))
      );
    };

    // Detección de columnas de nombres
    const fullNameIdx = findIndex([
      'nombre completo',
      'nombre y apellido',
      'nombres y apellidos',
      'apellidos y nombres',
      'publicador',
      'hermano',
      'full name',
      'persona',
      'usuario',
    ]);
    const firstNameIdx = findIndex(['primer nombre', 'first name', 'nombres', 'nombre']);
    const lastNameIdx = findIndex([
      'primer apellido',
      'segundo apellido',
      'apellidos',
      'last name',
      'apellido',
    ]);

    const emailIdx = findIndex(['correo', 'email', 'e-mail', 'mail', 'direccion de correo']);
    const phoneIdx = findIndex(['telefono', 'phone', 'tel', 'celular', 'movil', 'whatsapp']);
    const rolesIdx = findIndex(['rol', 'roles', 'nombramiento', 'cargo', 'privilegio', 'responsabilidad', 'servicio']);
    const leadIdx = findIndex(['dirige', 'lead', 'conduce', 'preside', 'dirigir']);
    const publicIdx = findIndex(['publica', 'carrito', 'public', 'exhibidor', 'cart']);
    const passIdx = findIndex(['clave', 'password', 'contrasena', 'pin']);

    if (fullNameIdx === -1 && firstNameIdx === -1) {
      setErrorMessage(
        'El archivo CSV debe contener al menos una columna con el nombre de los publicadores (ej: "Nombre Completo", "Publicador", o "Nombre" y "Apellido").'
      );
      return;
    }

    const items: ParsedPublisher[] = [];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const cols = rows[i].map((c) => c.replace(/^"(.*)"$/, '$1').trim());
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      let rawName = '';
      let firstName = '';
      let lastName = '';

      if (fullNameIdx !== -1) {
        const rawCol = cols[fullNameIdx] || '';
        if (rawCol.includes(',')) {
          const parts = rawCol.split(',');
          lastName = parts[0]?.trim() || '';
          firstName = parts.slice(1).join(' ').trim() || parts[0]?.trim() || '';
          rawName = `${firstName} ${lastName}`.trim();
        } else {
          rawName = rawCol.trim();
          const parts = rawName.split(/\s+/);
          firstName = parts[0] || rawName;
          lastName = parts.slice(1).join(' ') || '';
        }
      } else if (firstNameIdx !== -1) {
        firstName = cols[firstNameIdx] || '';
        lastName = lastNameIdx !== -1 ? cols[lastNameIdx] || '' : '';
        rawName = `${firstName} ${lastName}`.trim();
      }

      rawName = rawName.trim();
      if (!rawName) continue;

      // Correo electrónico: si no viene en el archivo o está vacío, generar un identificador seguro
      const userProvidedEmail = emailIdx !== -1 ? (cols[emailIdx] || '').trim().toLowerCase() : '';
      let rawEmail = userProvidedEmail;
      let isGeneratedEmail = false;

      if (!rawEmail || !rawEmail.includes('@')) {
        const slug = rawName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.')
          .replace(/^\.|\.$/g, '');
        rawEmail = `${slug || 'publicador'}.${i}@congregacion.local`;
        isGeneratedEmail = true;
      }

      const rawPhone = phoneIdx !== -1 ? cols[phoneIdx] : '';
      const rawRoles = rolesIdx !== -1 ? cols[rolesIdx] : '';
      const rawLead = leadIdx !== -1 ? cols[leadIdx] : '';
      const rawPublic = publicIdx !== -1 ? cols[publicIdx] : '';
      const rawPass = passIdx !== -1 ? cols[passIdx] : '';

      // Análisis y asignación de roles
      const cleanRoles = rawRoles
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const detectedRoles: UserRole[] = [];
      if (cleanRoles.includes('COORD')) detectedRoles.push('COORDINADOR');
      if (cleanRoles.includes('SUPERINTENDENTE') || cleanRoles.includes('SERVICIO')) {
        if (cleanRoles.includes('ASIST') || cleanRoles.includes('AYUD')) {
          detectedRoles.push('ASISTENTE_SUPERINTENDENTE_SERVICIO');
        } else {
          detectedRoles.push('SUPERINTENDENTE_DE_SERVICIO');
        }
      }
      if (cleanRoles.includes('ANCIANO') && !detectedRoles.includes('COORDINADOR')) {
        detectedRoles.push('ANCIANO');
      }
      if (cleanRoles.includes('SIERVO') || cleanRoles.includes('MINISTERIAL')) {
        detectedRoles.push('SIERVO_MINISTERIAL');
      }
      if (cleanRoles.includes('REGULAR')) detectedRoles.push('PRECURSOR_REGULAR');
      if (cleanRoles.includes('AUX')) detectedRoles.push('PRECURSOR_AUXILIAR');
      if (!detectedRoles.includes('PUBLICADOR')) detectedRoles.push('PUBLICADOR');

      const isElder =
        detectedRoles.includes('ANCIANO') ||
        detectedRoles.includes('COORDINADOR') ||
        detectedRoles.includes('SUPERINTENDENTE_DE_SERVICIO');

      const canLead =
        rawLead.toLowerCase().includes('si') ||
        rawLead.toLowerCase() === 'true' ||
        rawLead === '1' ||
        isElder;

      const canPublic =
        rawPublic === '' ||
        rawPublic.toLowerCase().includes('si') ||
        rawPublic.toLowerCase() === 'true' ||
        rawPublic === '1';

      // Validación
      const isValidEmail = rawEmail.includes('@') && rawEmail.includes('.');
      const isValidName = rawName.length >= 2;
      const isValid = isValidEmail && isValidName;

      let error = '';
      if (!isValidName) error = 'Nombre muy corto';
      else if (!isValidEmail) error = 'Correo no válido';

      items.push({
        fullName: rawName,
        firstName,
        lastName,
        email: rawEmail,
        phoneNumber: rawPhone || undefined,
        role: detectedRoles[0] || 'PUBLICADOR',
        roles: detectedRoles,
        canLeadPreaching: canLead,
        canPublicPreaching: canPublic,
        password: rawPass || 'password123',
        isValid,
        isGeneratedEmail,
        error,
      });
    }

    setParsedList(items);
    setErrorMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMessage('');

    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      setErrorMessage(
        'El archivo seleccionado es un libro de Excel (.xlsx/.xls). Por favor guárdalo o expórtalo desde Excel como archivo CSV (delimitado por comas o punto y coma) antes de subirlo.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength === 0) {
          setErrorMessage('El archivo seleccionado está vacío.');
          return;
        }

        let text = '';
        try {
          // Intentar decodificación UTF-8 estricta; falla ante bytes inválidos de ANSI/Windows-1252
          const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
          text = utf8Decoder.decode(buffer);
        } catch {
          // Si falló UTF-8 (típico de archivos CSV exportados por Excel en Windows en español), decodificar con Windows-1252
          const ansiDecoder = new TextDecoder('windows-1252');
          text = ansiDecoder.decode(buffer);
        }

        // Quitar BOM de UTF-8 (\uFEFF) si lo contiene
        if (text.charCodeAt(0) === 0xfeff) {
          text = text.slice(1);
        }

        parseCsvText(text);
      } catch (err: any) {
        setErrorMessage('Error al leer el archivo CSV: ' + (err.message || 'formato inválido'));
      }
    };

    reader.onerror = () => {
      setErrorMessage('No se pudo leer el archivo seleccionado.');
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    const validItems = parsedList.filter((p) => p.isValid);
    if (validItems.length === 0) {
      setErrorMessage('No hay publicadores válidos para importar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await apiService.bulkImportPublishers(validItems, congregationId);
      onImportSuccess(res.count || validItems.length);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error en la importación masiva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedList.filter((p) => p.isValid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carga Masiva de Publicadores (CSV)"
      subtitle="Importa el directorio completo de publicadores de tu congregación"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Zona de Descarga de Plantilla y Selección de Archivo */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              1. Descarga la plantilla oficial o usa tu propio archivo CSV
            </span>
            <span className="text-[11px] text-slate-500">
              Compatible con Excel, Google Sheets o cualquier archivo CSV delimitado por comas o punto y coma.
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Descargar Plantilla CSV
          </button>
        </div>

        {/* Carga de Archivo */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white hover:bg-slate-50/50"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv,text/plain"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-600">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800 block">
            {fileName ? `Archivo cargado: ${fileName}` : 'Haz clic para seleccionar el archivo CSV'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Sube el archivo CSV con los publicadores de la congregación
          </span>
        </div>

        {/* Vista Previa de Publicadores Detectados */}
        {parsedList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Publicadores detectados ({parsedList.length}) ·{' '}
                <strong className="text-emerald-700">{validCount} válidos</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setParsedList([]);
                  setFileName('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Nombre Completo</th>
                    <th className="p-2.5">Correo</th>
                    <th className="p-2.5">Teléfono</th>
                    <th className="p-2.5">Roles Asignados</th>
                    <th className="p-2.5 text-center">Dirige</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedList.map((item, idx) => (
                    <tr
                      key={idx}
                      className={item.isValid ? 'hover:bg-slate-50/70' : 'bg-rose-50/50'}
                    >
                      <td className="p-2 text-center w-8">
                        {item.isValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                        ) : (
                          <span
                            className="text-[10px] text-rose-600 font-bold"
                            title={item.error}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-semibold text-slate-900 truncate max-w-[160px]">
                        {item.fullName}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-600 truncate max-w-[180px]">
                        <span>{item.email}</span>
                        {item.isGeneratedEmail && (
                          <span
                            className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-amber-50 text-amber-700 border border-amber-200 font-sans"
                            title="Correo autogenerado para acceso local"
                          >
                            Auto
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-slate-500">
                        {item.phoneNumber || '—'}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {item.roles.map((r) => (
                            <span
                              key={r}
                              className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                            >
                              {r.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-center text-slate-600">
                        {item.canLeadPreaching ? '✓' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Acciones del Modal */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleExecuteImport}
            disabled={isSubmitting || validCount === 0}
          >
            {isSubmitting
              ? 'Importando publicadores...'
              : `Importar ${validCount} Publicadores`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
