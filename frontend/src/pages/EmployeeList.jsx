import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { searchEmployees } from '../api/employees';
import { errorMessage } from '../api/client';
import Avatar from '../components/Avatar';

const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function EmployeeList() {
  const [filters, setFilters] = useState({ q: '', department: '', position: '' });
  const [sorting, setSorting] = useState([]);
  const debounced = useDebounced(filters);

  // The query key includes the filters, so TanStack Query refetches whenever they change
  const { data = [], isLoading, isFetching, error } = useQuery({
    queryKey: ['employees', debounced],
    queryFn: () => searchEmployees(debounced),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Employee',
        accessorFn: (r) => `${r.first_name} ${r.last_name}`,
        cell: ({ row }) => (
          <Link to={`/employees/${row.original._id}`} className="name-cell">
            <Avatar employee={row.original} />
            <span>{row.original.first_name} {row.original.last_name}</span>
          </Link>
        ),
      },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'position', header: 'Position' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'salary', header: 'Salary', cell: ({ getValue }) => money.format(getValue()) },
      {
        accessorKey: 'date_of_joining',
        header: 'Joined',
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-CA', { timeZone: 'UTC' }),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-head">
        <h1>Employees</h1>
        <Link to="/employees/new" className="btn btn-primary">+ Add employee</Link>
      </div>

      <div className="card filters">
        <input placeholder="Search name or email…" value={filters.q} onChange={set('q')} aria-label="Search name or email" />
        <input placeholder="Department" value={filters.department} onChange={set('department')} aria-label="Department" />
        <input placeholder="Position" value={filters.position} onChange={set('position')} aria-label="Position" />
        {hasFilters && (
          <button className="btn btn-ghost" onClick={() => setFilters({ q: '', department: '', position: '' })}>Clear</button>
        )}
      </div>

      {error && <p className="alert alert-error" role="alert">{errorMessage(error)}</p>}

      <div className="card table-wrap" style={{ opacity: isFetching && !isLoading ? 0.6 : 1 }}>
        {isLoading ? (
          <p className="empty">Loading…</p>
        ) : data.length === 0 ? (
          <p className="empty">{hasFilters ? 'No employees match your search.' : 'No employees yet. Add your first one!'}</p>
        ) : (
          <table>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} onClick={h.column.getToggleSortingHandler()} className="sortable">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted()] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((c) => (
                    <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="muted small">{data.length} employee{data.length === 1 ? '' : 's'} · click a column header to sort</p>
    </>
  );
}
