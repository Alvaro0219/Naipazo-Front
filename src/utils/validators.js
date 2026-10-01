// Reglas de formulario espejadas del backend, para dar feedback inmediato.
// El backend sigue siendo la autoridad: estas reglas solo evitan viajes inútiles.
export const USERNAME_REGEX = /^[A-Za-z0-9_.]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rules = {
  required: (label) => (v) => (v !== null && v !== undefined && String(v).trim() !== '') || `${label} es obligatorio`,
  username: (v) => {
    const value = String(v || '').trim();
    if (value.length < 3) return 'Tiene que tener al menos 3 caracteres';
    if (value.length > 20) return 'Puede tener como máximo 20 caracteres';
    if (!USERNAME_REGEX.test(value)) return 'Solo letras, números, "_" y "."';
    return true;
  },
  email: (v) => EMAIL_REGEX.test(String(v || '').trim()) || 'Ingresá un email válido',
  password: (v) => String(v || '').length >= 8 || 'Tiene que tener al menos 8 caracteres'
};
