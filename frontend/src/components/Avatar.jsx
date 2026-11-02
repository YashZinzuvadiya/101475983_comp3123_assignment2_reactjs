import { pictureSrc } from '../api/client';

export default function Avatar({ employee, size = 36 }) {
  const src = pictureSrc(employee);
  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.4 };
  return src ? (
    <img className="avatar" style={style} src={src} alt={`${employee.first_name} ${employee.last_name}`} />
  ) : (
    <span className="avatar avatar-fallback" style={style} aria-hidden="true">{initials}</span>
  );
}
