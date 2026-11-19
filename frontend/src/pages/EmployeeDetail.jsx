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

  if (isLoading) return <p className="text-center text-secondary py-5">Loading…</p>;
  if (loadError) {
    const status = loadError.response?.status;
    return (
      <>
        <p className="alert alert-danger">{status === 403 ? 'You do not have access to this employee.' : status === 404 ? 'Employee not found.' : errorMessage(loadError)}</p>
        <Link to="/employees" className="btn btn-outline-secondary">← Back to list</Link>
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
      <div className="mb-3"><Link to="/employees" className="text-decoration-none">← All employees</Link></div>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <div className="card shadow-sm p-4 detail">
        <div className="detail-photo">
          <Avatar employee={emp} size={140} />
          <label className="btn btn-outline-secondary btn-sm">
            {upload.isPending ? 'Uploading…' : emp.profile_picture ? 'Change picture' : 'Upload picture'}
            <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} disabled={upload.isPending} />
          </label>
        </div>
        <div className="detail-info">
          <h1 className="h3">{emp.first_name} {emp.last_name}</h1>
          <dl className="my-3">
            {rows.map(([k, v]) => (<div key={k} className="d-flex border-bottom py-2"><dt className="text-secondary fw-normal" style={{ width: 140 }}>{k}</dt><dd className="mb-0 fw-medium">{v}</dd></div>))}
          </dl>
          <div className="d-flex gap-2">
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
