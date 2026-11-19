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

  // Editing a field clears its own error straight away
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

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

  if (editing && existing.isLoading) return <p className="text-center text-secondary py-5">Loading…</p>;
  if (editing && existing.error) return <p className="alert alert-danger">{errorMessage(existing.error)}</p>;

  const field = (k, label, props = {}) => (
    <div className="col-md-6">
      <label className="form-label" htmlFor={k}>{label}</label>
      <input id={k} className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={form[k]} onChange={set(k)} {...props} />
      {errors[k] && <div className="invalid-feedback">{errors[k]}</div>}
    </div>
  );

  return (
    <>
      <h1 className="h3 mb-3">{editing ? 'Edit employee' : 'Add employee'}</h1>
      <form className="card shadow-sm p-4 row g-3 mx-0" onSubmit={onSubmit} noValidate>
        {error && <p className="alert alert-danger col-12" role="alert">{error}</p>}
        {field('first_name', 'First name')}
        {field('last_name', 'Last name')}
        {field('email', 'Email', { type: 'email' })}
        {field('position', 'Position')}
        {field('department', 'Department')}
        {field('salary', 'Salary (CAD)', { type: 'number', min: '0', step: '0.01' })}
        {field('date_of_joining', 'Date of joining', { type: 'date' })}
        <div className="col-md-6"><label className="form-label" htmlFor="picture">Profile picture (optional, max 2 MB)</label>
          <input id="picture" className={`form-control ${errors.picture ? 'is-invalid' : ''}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} />
          {errors.picture && <div className="invalid-feedback">{errors.picture}</div>}</div>
        <div className="col-12 d-flex gap-2">
          <button className="btn btn-primary" disabled={save.isPending || !!errors.picture}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create employee'}
          </button>
          <Link to={editing ? `/employees/${id}` : '/employees'} className="btn btn-outline-secondary">Cancel</Link>
        </div>
      </form>
    </>
  );
}
