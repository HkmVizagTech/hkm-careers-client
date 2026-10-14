'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, FileText, Landmark, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import EmployeeForm, { checkForm, EMPTY_EMPLOYEE, inputFromForm, type EmployeeFormState } from '@/components/admin/EmployeeForm';
import { createEmployeeFromApplication, getDepartments } from '@/lib/services';
import { toast } from '@/lib/toast';
import type { Application, Department } from '@/types';

const apiMessage = (err: unknown) => {
  const e = err as { response?: { status?: number; data?: { message?: string; employee?: string } } };
  return { message: e.response?.data?.message || 'Could not add to Employees', existing: e.response?.data?.employee };
};

/**
 * "Add to employees" on a Selected application: copies their details, documents (except files HR
 * asked to be replaced), resume and bank details into a separate employee record.
 */
export default function AddToEmployees({ app }: { app: Application }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_EMPLOYEE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !departments.length) getDepartments().then(setDepartments).catch(() => {});
  }, [open, departments.length]);

  if (app.employee) {
    return (
      <Link
        href={`/admin/employees/${app.employee}`}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
      >
        <Users className="h-4 w-4" /> Employee record
      </Link>
    );
  }
  if (app.status !== 'selected') return null;

  const job = typeof app.job === 'object' && app.job ? app.job : null;
  const requests = app.documentRequests || [];
  const files = requests.flatMap((r) => r.items.filter((i) => i.status !== 'rejected').flatMap((i) => i.files.map(() => i.label)));
  const hasBank = requests.some((r) => r.bank?.accountLast4);
  const waiting = requests.flatMap((r) => r.items.filter((i) => i.required && (!i.files.length || i.status === 'rejected')).map((i) => i.label));

  const start = () => {
    const dept = job && typeof job.department === 'object' && job.department ? job.department._id : (job?.department as string) || '';
    setForm({ ...EMPTY_EMPLOYEE, name: app.name, designation: job?.title || '', department: dept });
    setOpen(true);
  };

  const save = async () => {
    const problem = checkForm(form, ['job']);
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const input = inputFromForm(form, ['job']);
      const emp = await createEmployeeFromApplication(app._id, input);
      toast.success(
        `${emp.name} added to Employees with ${emp.copied ?? 0} document${emp.copied === 1 ? '' : 's'}${emp.failed ? ` (${emp.failed} couldn't be copied)` : ''}`
      );
      router.push(`/admin/employees/${emp._id}`);
    } catch (err) {
      const { message, existing } = apiMessage(err);
      toast.error(message);
      if (existing) router.push(`/admin/employees/${existing}`);
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        <UserPlus className="h-4 w-4" /> Add to employees
      </button>

      <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title="Add to employees" size="xl">
        <p className="-mt-2 text-sm text-gray-500">
          Creates a separate staff record for {app.name}. It keeps its own copy of everything, so it stays even if this application is deleted.
        </p>

        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
          <p className="font-semibold text-emerald-900">What gets copied</p>
          <ul className="mt-2 space-y-1.5 text-emerald-900/90">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" /> Name, phone, email, gender, date of birth and location
            </li>
            <li className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Resume{files.length ? ` and ${files.length} uploaded document${files.length === 1 ? '' : 's'}` : ''}
                {files.length > 0 && <span className="text-emerald-800/70"> ({Array.from(new Set(files)).join(', ')})</span>}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Landmark className="h-4 w-4 shrink-0 text-emerald-600" /> {hasBank ? 'Bank details' : 'No bank details yet (you can add them later)'}
            </li>
          </ul>
          {waiting.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
              Still waiting for: {Array.from(new Set(waiting)).join(', ')}. You can upload those on the employee page later.
            </p>
          )}
        </div>

        <div className="mt-5">
          <EmployeeForm value={form} onChange={setForm} sections={['job']} departments={departments} showTitles={false} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} className="!bg-emerald-600 hover:!bg-emerald-700">
            <UserPlus className="h-4 w-4" /> Add to employees
          </Button>
        </div>
      </Modal>
    </>
  );
}
