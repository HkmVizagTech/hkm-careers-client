'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, Plus, Search, Users, X } from 'lucide-react';
import { createEmployee, getDepartments, getEmployees } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SelectField } from '@/components/ui/SelectField';
import EmployeeForm, { checkForm, EMPTY_EMPLOYEE, inputFromForm, type EmployeeFormState } from '@/components/admin/EmployeeForm';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import type { Department, EmployeeListItem } from '@/types';

const apiMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeListItem[] | null>(null);
  const [counts, setCounts] = useState({ active: 0, left: 0, total: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [status, setStatus] = useState<'active' | 'left' | ''>('active');
  const [department, setDepartment] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_EMPLOYEE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let live = true;
    getEmployees({ q: search || undefined, status: status || undefined, department: department || undefined })
      .then((d) => {
        if (!live) return;
        setEmployees(d.employees);
        setCounts(d.counts);
      })
      .catch(() => {
        if (live) setEmployees([]);
        toast.error('Could not load employees');
      });
    return () => {
      live = false;
    };
  }, [search, status, department]);

  const save = async () => {
    const problem = checkForm(form, ['job', 'contact']);
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const emp = await createEmployee(inputFromForm(form, ['job', 'contact']));
      toast.success(`${emp.name} added`);
      router.push(`/admin/employees/${emp._id}`);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not add the employee'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { v: 'active' as const, label: 'Working', n: counts.active },
    { v: 'left' as const, label: 'Left', n: counts.left },
    { v: '' as const, label: 'All', n: counts.total },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">Staff records with their documents and bank details. They stay even if the job application is deleted.</p>
        </div>
        <Button
          onClick={() => {
            setForm(EMPTY_EMPLOYEE);
            setAdding(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add employee
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex rounded-xl bg-white p-1 shadow-soft ring-1 ring-hairline" role="tablist" aria-label="Status">
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={status === t.v}
              onClick={() => setStatus(t.v)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors lg:flex-none ${
                status === t.v ? 'bg-navy text-white' : 'text-gray-500 hover:text-navy'
              }`}
            >
              {t.label} <span className={status === t.v ? 'text-white/70' : 'text-gray-400'}>{t.n}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, employee ID, phone, email or designation"
            aria-label="Search employees"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-soft focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <SelectField
          size="sm"
          className="lg:!w-56"
          ariaLabel="Department"
          value={department}
          onChange={setDepartment}
          options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]}
        />
      </div>

      <div className="mt-5">
        {employees === null ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-semibold text-navy">{search || department ? 'No one matches' : status === 'left' ? 'No one has left' : 'No employees yet'}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Open a Selected application and click <strong>Add to employees</strong> to bring over their details and documents, or add someone by hand.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
            {employees.map((e, i) => (
              <motion.li key={e._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.02 }}>
                <Link
                  href={`/admin/employees/${e._id}`}
                  className="flex items-center gap-4 border-b border-gray-100 px-4 py-3.5 transition-colors last:border-0 hover:bg-gray-50 sm:px-5"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                      e.status === 'left' ? 'bg-gray-400' : 'bg-gradient-to-br from-navy to-ocean'
                    }`}
                  >
                    {initials(e.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="truncate font-semibold text-navy">{e.name}</span>
                      {e.employeeId && <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600">{e.employeeId}</span>}
                      {e.status === 'left' && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Left</span>}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {[e.designation, e.department?.name].filter(Boolean).join(' · ') || 'No designation yet'}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right text-xs text-gray-500 md:block">
                    <p>{e.joiningDate ? `Joined ${formatDate(e.joiningDate)}` : 'Joining date not set'}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {e.documentCount} document{e.documentCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={adding} onClose={() => !saving && setAdding(false)} title="Add employee" size="xl">
        <p className="-mt-2 mb-5 text-sm text-gray-500">
          For someone who didn&apos;t apply through the website. You can add personal details, bank details and documents on the next page.
        </p>
        <EmployeeForm value={form} onChange={setForm} sections={['job', 'contact']} departments={departments} />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAdding(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            <Plus className="h-4 w-4" /> Add employee
          </Button>
        </div>
      </Modal>
    </div>
  );
}
