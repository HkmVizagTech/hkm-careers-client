'use client';

import { DatePicker } from '@/components/ui/DatePicker';
import { SelectField } from '@/components/ui/SelectField';
import { toISTDateInput } from '@/lib/utils';
import type { Department, Employee, EmployeeInput } from '@/types';

export type EmployeeSection = 'job' | 'contact' | 'emergency' | 'personal' | 'bank' | 'notes';

export interface EmployeeFormState {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  joiningDate: string;
  status: 'active' | 'left';
  leavingDate: string;
  email: string;
  phone: string;
  altPhone: string;
  currentAddress: string;
  permanentAddress: string;
  ecName: string;
  ecRelationship: string;
  ecPhone: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  aadhaar: string;
  pan: string;
  bankHolder: string;
  bankAccount: string;
  bankIfsc: string;
  bankName: string;
  bankBranch: string;
  bankType: string;
  notes: string;
}

export const EMPTY_EMPLOYEE: EmployeeFormState = {
  employeeId: '',
  name: '',
  designation: '',
  department: '',
  joiningDate: '',
  status: 'active',
  leavingDate: '',
  email: '',
  phone: '',
  altPhone: '',
  currentAddress: '',
  permanentAddress: '',
  ecName: '',
  ecRelationship: '',
  ecPhone: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  aadhaar: '',
  pan: '',
  bankHolder: '',
  bankAccount: '',
  bankIfsc: '',
  bankName: '',
  bankBranch: '',
  bankType: 'savings',
  notes: '',
};

const day = (d?: string) => (d ? toISTDateInput(d) : '');

export function formFromEmployee(e: Employee): EmployeeFormState {
  return {
    ...EMPTY_EMPLOYEE,
    employeeId: e.employeeId || '',
    name: e.name || '',
    designation: e.designation || '',
    department: e.department?._id || '',
    joiningDate: day(e.joiningDate),
    status: e.status || 'active',
    leavingDate: day(e.leavingDate),
    email: e.email || '',
    phone: e.phone || '',
    altPhone: e.altPhone || '',
    currentAddress: e.currentAddress || '',
    permanentAddress: e.permanentAddress || '',
    ecName: e.emergencyContact?.name || '',
    ecRelationship: e.emergencyContact?.relationship || '',
    ecPhone: e.emergencyContact?.phone || '',
    gender: e.gender || '',
    dateOfBirth: day(e.dateOfBirth),
    bloodGroup: e.bloodGroup || '',
    bankHolder: e.bank?.holder || '',
    bankIfsc: e.bank?.ifsc || '',
    bankName: e.bank?.bankName || '',
    bankBranch: e.bank?.branch || '',
    bankType: e.bank?.accountType || 'savings',
    notes: e.notes || '',
  };
}

/** Only the fields of the given sections; Aadhaar / PAN / account number only when something was typed. */
export function inputFromForm(f: EmployeeFormState, sections: EmployeeSection[]): EmployeeInput {
  const out: EmployeeInput = {};
  if (sections.includes('job')) {
    Object.assign(out, {
      employeeId: f.employeeId.trim(),
      name: f.name.trim(),
      designation: f.designation.trim(),
      department: f.department,
      joiningDate: f.joiningDate,
      status: f.status,
      leavingDate: f.status === 'left' ? f.leavingDate : '',
    });
  }
  if (sections.includes('contact')) {
    Object.assign(out, {
      email: f.email.trim(),
      phone: f.phone.trim(),
      altPhone: f.altPhone.trim(),
      currentAddress: f.currentAddress.trim(),
      permanentAddress: f.permanentAddress.trim(),
    });
  }
  if (sections.includes('emergency')) {
    out.emergencyContact = { name: f.ecName.trim(), relationship: f.ecRelationship.trim(), phone: f.ecPhone.trim() };
  }
  if (sections.includes('personal')) {
    Object.assign(out, { gender: f.gender, dateOfBirth: f.dateOfBirth, bloodGroup: f.bloodGroup });
    if (f.aadhaar.trim()) out.aadhaar = f.aadhaar.replace(/\s+/g, '');
    if (f.pan.trim()) out.pan = f.pan.trim().toUpperCase();
  }
  if (sections.includes('bank')) {
    const any = [f.bankHolder, f.bankAccount, f.bankIfsc, f.bankName, f.bankBranch].some((v) => v.trim());
    if (any) {
      out.bank = {
        holder: f.bankHolder.trim(),
        ifsc: f.bankIfsc.trim().toUpperCase(),
        bankName: f.bankName.trim(),
        branch: f.bankBranch.trim(),
        accountType: f.bankType,
        ...(f.bankAccount.trim() ? { account: f.bankAccount.replace(/\s+/g, '') } : {}),
      };
    }
  }
  if (sections.includes('notes')) out.notes = f.notes.trim();
  return out;
}

/** Quick checks before saving (the server checks again). Returns a message or ''. */
export function checkForm(f: EmployeeFormState, sections: EmployeeSection[]): string {
  if (sections.includes('job') && !f.name.trim()) return 'Enter the name';
  if (sections.includes('contact') && f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return 'Enter a valid email address';
  if (sections.includes('personal')) {
    if (f.aadhaar.trim() && !/^\d{12}$/.test(f.aadhaar.replace(/\s+/g, ''))) return 'Aadhaar number should be 12 digits';
    if (f.pan.trim() && !/^[A-Z]{5}\d{4}[A-Z]$/.test(f.pan.trim().toUpperCase())) return 'PAN should look like ABCDE1234F';
  }
  if (sections.includes('bank')) {
    if (f.bankAccount.trim() && !/^\d{9,18}$/.test(f.bankAccount.replace(/\s+/g, ''))) return 'Account number should be 9 to 18 digits';
    if (f.bankIfsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.bankIfsc.trim().toUpperCase())) return 'IFSC should look like SBIN0001234';
  }
  return '';
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-ocean focus:outline-none focus:ring-4 focus:ring-ocean/15';

function Field({ label, children, wide, hint }: { label: string; children: React.ReactNode; wide?: boolean; hint?: string }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <span className="mb-1 block text-xs font-semibold text-gray-600">
        {label} {hint && <span className="font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

const SECTION_TITLE: Record<EmployeeSection, string> = {
  job: 'Job details',
  contact: 'Contact & address',
  emergency: 'Emergency contact',
  personal: 'Personal details',
  bank: 'Bank details',
  notes: 'Notes',
};

/** The editable fields of an employee, grouped by section. */
export default function EmployeeForm({
  value,
  onChange,
  sections,
  departments,
  saved,
  showTitles = true,
}: {
  value: EmployeeFormState;
  onChange: (next: EmployeeFormState) => void;
  sections: EmployeeSection[];
  departments: Department[];
  /** What's already stored, so the masked fields can say "leave blank to keep". */
  saved?: Pick<Employee, 'hasAadhaar' | 'aadhaarLast4' | 'hasPan' | 'panLast4' | 'bank'>;
  showTitles?: boolean;
}) {
  const set = <K extends keyof EmployeeFormState>(k: K, v: EmployeeFormState[K]) => onChange({ ...value, [k]: v });
  const text = (k: keyof EmployeeFormState, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input value={value[k] as string} onChange={(e) => set(k, e.target.value as never)} className={inputCls} {...props} />
  );

  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <section key={sec}>
          {showTitles && <h3 className="mb-3 text-sm font-bold text-navy">{SECTION_TITLE[sec]}</h3>}
          <div className="grid gap-3 sm:grid-cols-2">
            {sec === 'job' && (
              <>
                <Field label="Full name">{text('name', { maxLength: 120, autoComplete: 'off' })}</Field>
                <Field label="Employee ID" hint="(optional)">
                  {text('employeeId', { maxLength: 40, placeholder: 'e.g. HKM-0142', className: `${inputCls} uppercase placeholder:normal-case` })}
                </Field>
                <Field label="Designation">{text('designation', { maxLength: 120, placeholder: 'e.g. Cook' })}</Field>
                <Field label="Department">
                  <SelectField
                    size="sm"
                    value={value.department}
                    onChange={(v) => set('department', v)}
                    placeholder="Choose department"
                    options={[{ value: '', label: 'No department' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]}
                  />
                </Field>
                <Field label="Joining date">
                  <DatePicker size="sm" value={value.joiningDate} onChange={(v) => set('joiningDate', v)} minYear={1990} placeholder="Select date" />
                </Field>
                <Field label="Status">
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Status">
                    {(['active', 'left'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={value.status === s}
                        onClick={() => set('status', s)}
                        className={`rounded-lg py-1.5 text-sm font-semibold ${value.status === s ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
                      >
                        {s === 'active' ? 'Working' : 'Left'}
                      </button>
                    ))}
                  </div>
                </Field>
                {value.status === 'left' && (
                  <Field label="Leaving date">
                    <DatePicker size="sm" value={value.leavingDate} onChange={(v) => set('leavingDate', v)} minYear={1990} placeholder="Select date" />
                  </Field>
                )}
              </>
            )}

            {sec === 'contact' && (
              <>
                <Field label="Email">{text('email', { type: 'email', maxLength: 200 })}</Field>
                <Field label="Phone">{text('phone', { inputMode: 'tel', maxLength: 20 })}</Field>
                <Field label="Alternate phone" hint="(optional)">
                  {text('altPhone', { inputMode: 'tel', maxLength: 20 })}
                </Field>
                <div className="hidden sm:block" />
                <Field label="Current address" wide>
                  <textarea rows={2} value={value.currentAddress} onChange={(e) => set('currentAddress', e.target.value)} maxLength={500} className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Permanent address" wide>
                  <textarea rows={2} value={value.permanentAddress} onChange={(e) => set('permanentAddress', e.target.value)} maxLength={500} className={`${inputCls} resize-none`} />
                  <button
                    type="button"
                    onClick={() => set('permanentAddress', value.currentAddress)}
                    disabled={!value.currentAddress.trim()}
                    className="mt-1 text-xs font-semibold text-ocean hover:text-navy disabled:opacity-40"
                  >
                    Same as current address
                  </button>
                </Field>
              </>
            )}

            {sec === 'emergency' && (
              <>
                <Field label="Name">{text('ecName', { maxLength: 120 })}</Field>
                <Field label="Relationship">{text('ecRelationship', { maxLength: 60, placeholder: 'e.g. Father, Spouse' })}</Field>
                <Field label="Phone">{text('ecPhone', { inputMode: 'tel', maxLength: 20 })}</Field>
              </>
            )}

            {sec === 'personal' && (
              <>
                <Field label="Gender">
                  <SelectField
                    size="sm"
                    value={value.gender}
                    onChange={(v) => set('gender', v)}
                    placeholder="Choose"
                    options={[
                      { value: '', label: 'Not given' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </Field>
                <Field label="Date of birth">
                  <DatePicker size="sm" value={value.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} disableFuture minYear={1940} placeholder="Select date" />
                </Field>
                <Field label="Blood group">
                  <SelectField
                    size="sm"
                    value={value.bloodGroup}
                    onChange={(v) => set('bloodGroup', v)}
                    placeholder="Choose"
                    options={[{ value: '', label: 'Not given' }, ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => ({ value: b, label: b }))]}
                  />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Aadhaar number" hint={saved?.hasAadhaar ? `(saved ••••${saved.aadhaarLast4}, leave blank to keep)` : '(stored encrypted)'}>
                  <input
                    value={value.aadhaar}
                    onChange={(e) => set('aadhaar', e.target.value.replace(/[^\d\s]/g, '').slice(0, 14))}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="12 digits"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="PAN" hint={saved?.hasPan ? `(saved ••••${saved.panLast4}, leave blank to keep)` : '(stored encrypted)'}>
                  <input
                    value={value.pan}
                    onChange={(e) => set('pan', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    autoComplete="off"
                    placeholder="ABCDE1234F"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
              </>
            )}

            {sec === 'bank' && (
              <>
                <Field label="Account holder">{text('bankHolder', { maxLength: 100 })}</Field>
                <Field
                  label="Account number"
                  hint={saved?.bank?.accountLast4 ? `(saved ••••${saved.bank.accountLast4}, leave blank to keep)` : '(stored encrypted)'}
                >
                  <input
                    value={value.bankAccount}
                    onChange={(e) => set('bankAccount', e.target.value.replace(/[^\d\s]/g, ''))}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={22}
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="IFSC">
                  <input
                    value={value.bankIfsc}
                    onChange={(e) => set('bankIfsc', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                    autoComplete="off"
                    placeholder="SBIN0001234"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Bank name">{text('bankName', { maxLength: 100 })}</Field>
                <Field label="Branch" hint="(optional)">
                  {text('bankBranch', { maxLength: 100 })}
                </Field>
                <Field label="Account type">
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Account type">
                    {['savings', 'current'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={value.bankType === t}
                        onClick={() => set('bankType', t)}
                        className={`rounded-lg py-1.5 text-sm font-semibold capitalize ${value.bankType === t ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {sec === 'notes' && (
              <Field label="Notes" wide>
                <textarea rows={4} value={value.notes} onChange={(e) => set('notes', e.target.value)} maxLength={3000} className={`${inputCls} resize-y`} />
              </Field>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
