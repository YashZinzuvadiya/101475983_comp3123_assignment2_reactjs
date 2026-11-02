import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEmployee, getEmployee, updateEmployee, uploadPicture } from '../api/employees';
import { errorMessage } from '../api/client';

const EMPTY = { first_name: '', last_name: '', email: '', position: '', salary: '', date_of_joining: '', department: '' };
const MAX_IMG = 2 * 1024 * 1024;

function validate(f) {
  const e = {};
  for (const k of ['first_name', 'last_name', 'position', 'department']) if (!f[k].trim()) e[k] = 'Required';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (!(Number(f.salary) > 0)) e.salary = 'Salary must be greater than 0';
  if (!f.date_of_joining) e.date_of_joining = 'Required';
  return e;
}

export default function EmployeeForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');

  const existing = useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id), enabled: editing });

  useEffect(() => {
    if (existing.data) {
      const e = existing.data;
      setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, String(e[k] ?? '')])), date_of_joining: e.date_of_joining.slice(0, 10) });
    }
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      const data = { ...form, salary: Number(form.salary) };
      const emp = editing ? await updateEmployee({ id, data }) : await createEmployee(data);
      if (file) await uploadPicture({ id: emp._id, file });
      return emp;
    },
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', emp._id] });
      navigate(`/employees/${emp._id}`);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onFile = (e) => {
    const f = e.target.files[0];
    setErrors((p) => ({ ...p, picture: undefined }));
    if (!f) return setFile(null);
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type))
      return setErrors((p) => ({ ...p, picture: 'Choose a JPEG, PNG, WEBP or GIF image' }));
    if (f.size > MAX_IMG) return setErrors((p) => ({ ...p, picture: 'Image must be 2 MB or smaller' }));
    setFile(f);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate();
  };

  if (editing && existing.isLoading) return <p className="empty">Loading…</p>;
  if (editing && existing.error) return <p className="alert alert-error">{errorMessage(existing.error)}</p>;

  const field = (k, label, props = {}) => (
    <label>{label}
      <input value={form[k]} onChange={set(k)} {...props} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  return (
    <>
      <div className="page-head"><h1>{editing ? 'Edit employee' : 'Add employee'}</h1></div>
      <form className="card form-grid" onSubmit={onSubmit} noValidate>
        {error && <p className="alert alert-error full" role="alert">{error}</p>}
        {field('first_name', 'First name')}
        {field('last_name', 'Last name')}
        {field('email', 'Email', { type: 'email' })}
        {field('position', 'Position')}
        {field('department', 'Department')}
        {field('salary', 'Salary (CAD)', { type: 'number', min: '0', step: '0.01' })}
        {field('date_of_joining', 'Date of joining', { type: 'date' })}
        <label>Profile picture (optional, max 2 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} />
          {errors.picture && <span className="field-error">{errors.picture}</span>}
        </label>
        <div className="actions full">
          <button className="btn btn-primary" disabled={save.isPending || !!errors.picture}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create employee'}
          </button>
          <Link to={editing ? `/employees/${id}` : '/employees'} className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}
