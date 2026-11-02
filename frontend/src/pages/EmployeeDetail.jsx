import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteEmployee, getEmployee, uploadPicture } from '../api/employees';
import { errorMessage } from '../api/client';
import Avatar from '../components/Avatar';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const { data: emp, isLoading, error: loadError } = useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id) });

  const upload = useMutation({
    mutationFn: (file) => uploadPicture({ id, file }),
    onSuccess: (updated) => {
      setError('');
      qc.setQueryData(['employee', id], updated);
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => deleteEmployee(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['employee', id] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      navigate('/employees', { replace: true });
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const onFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) return setError('Choose a JPEG, PNG, WEBP or GIF image');
    if (f.size > 2 * 1024 * 1024) return setError('Image must be 2 MB or smaller');
    upload.mutate(f);
  };

  if (isLoading) return <p className="empty">Loading…</p>;
  if (loadError) {
    const status = loadError.response?.status;
    return (
      <>
        <p className="alert alert-error">{status === 403 ? 'You do not have access to this employee.' : status === 404 ? 'Employee not found.' : errorMessage(loadError)}</p>
        <Link to="/employees" className="btn btn-ghost">← Back to list</Link>
      </>
    );
  }

  const rows = [
    ['Email', emp.email],
    ['Position', emp.position],
    ['Department', emp.department],
    ['Salary', new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(emp.salary)],
    ['Date of joining', new Date(emp.date_of_joining).toLocaleDateString('en-CA', { timeZone: 'UTC' })],
  ];

  return (
    <>
      <div className="page-head">
        <Link to="/employees" className="muted">← All employees</Link>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="card detail">
        <div className="detail-photo">
          <Avatar employee={emp} size={140} />
          <label className="btn btn-ghost">
            {upload.isPending ? 'Uploading…' : emp.profile_picture ? 'Change picture' : 'Upload picture'}
            <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} disabled={upload.isPending} />
          </label>
        </div>
        <div className="detail-info">
          <h1>{emp.first_name} {emp.last_name}</h1>
          <dl>
            {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
          <div className="actions">
            <Link to={`/employees/${id}/edit`} className="btn btn-primary">Edit</Link>
            <button
              className="btn btn-danger"
              disabled={remove.isPending}
              onClick={() => window.confirm(`Delete ${emp.first_name} ${emp.last_name}? This cannot be undone.`) && remove.mutate()}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
