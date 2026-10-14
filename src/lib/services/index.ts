import api from "@/lib/api";
import type {
  Job,
  JobsResponse,
  Application,
  ApplicationsResponse,
  WhatsAppMessage,
  Department,
  QualificationOption,
  EmailDraft,
  DocumentRequest,
  CandidateDocumentView,
  JobAlertSubscriber,
  Employee,
  EmployeeListItem,
  EmployeeInput,
  DashboardStats,
  AdminUser,
  AuthUser,
  AdminNotification,
  AttentionSummary,
  Interview,
  FollowUp,
  RoleFilled,
  JobPipeline,
  EmailLog,
  MailStatus,
  CandidateNotification,
} from "@/types";

export async function getPublicJobs(params?: {
  department?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<JobsResponse> {
  const { data } = await api.get("/jobs/public", { params });
  return data;
}

export async function getPublicJobBySlug(
  slug: string
): Promise<Job> {
  const { data } = await api.get(`/jobs/public/${slug}`);
  return data;
}

export async function getAdminJobs(params?: {
  department?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<JobsResponse> {
  const { data } = await api.get("/jobs", { params });
  return data;
}

export async function getAdminJob(id: string): Promise<Job> {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function createJob(
  job: Partial<Job> & { department: string }
): Promise<Job> {
  const { data } = await api.post("/jobs", job);
  return data;
}

export async function updateJob(
  id: string,
  job: Partial<Job>
): Promise<Job> {
  const { data } = await api.put(`/jobs/${id}`, job);
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}

export interface DuplicateApplication {
  duplicate: boolean;
  code?: 'DUPLICATE_APPLICATION';
  matchedBy?: 'email' | 'phone';
  applicationNumber?: string;
  appliedAt?: string;
  message?: string;
}

/** Has this email or phone already applied for this job? (public) */
export async function checkDuplicateApplication(job: string, email: string, phone: string): Promise<DuplicateApplication> {
  const { data } = await api.post("/applications/check", { job, email, phone });
  return data;
}

export async function submitApplication(formData: FormData): Promise<{
  message: string;
  application: { id: string; name: string; email: string };
}> {
  const { data } = await api.post("/applications", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function trackApplication(id: string): Promise<{
  name: string;
  email: string;
  job: { title: string; location: string; type: string } | null;
  status: string;
  appliedAt: string;
  interview?: { scheduledAt: string; mode: "in-person" | "phone" | "video"; venue: string; link: string } | null;
}> {
  const { data } = await api.get(`/applications/track/${id}`);
  return data;
}

export async function getAdminApplications(params?: {
  job?: string;
  status?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApplicationsResponse> {
  const { data } = await api.get("/applications", { params });
  return data;
}

export async function getAdminApplication(
  id: string
): Promise<Application> {
  const { data } = await api.get(`/applications/${id}`);
  return data;
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  notify = true
): Promise<Application & { notification?: CandidateNotification | null; roleFilled?: RoleFilled | null }> {
  const { data } = await api.patch(`/applications/${id}/status`, {
    status,
    notify,
  });
  return data;
}

/** Re-send the WhatsApp message that matches the application's current status. */
export async function resendApplicationNotification(id: string): Promise<{
  notification: CandidateNotification | null;
  whatsappMessages: WhatsAppMessage[];
}> {
  const { data } = await api.post(`/applications/${id}/notify`);
  return data;
}

export async function addApplicationNote(
  id: string,
  text: string
): Promise<Application> {
  const { data } = await api.post(`/applications/${id}/notes`, {
    text,
  });
  return data;
}

export async function deleteApplication(id: string): Promise<void> {
  await api.delete(`/applications/${id}`);
}

export async function getDepartments(params?: {
  active?: boolean;
}): Promise<Department[]> {
  const { data } = await api.get("/departments", { params });
  return data;
}

export async function getDepartment(id: string): Promise<Department> {
  const { data } = await api.get(`/departments/${id}`);
  return data;
}

export async function createDepartment(
  dept: Pick<Department, "name" | "description">
): Promise<Department> {
  const { data } = await api.post("/departments", dept);
  return data;
}

export async function updateDepartment(
  id: string,
  dept: Partial<Department>
): Promise<Department> {
  const { data } = await api.put(`/departments/${id}`, dept);
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}

export async function getQualificationOptions(): Promise<QualificationOption[]> {
  const { data } = await api.get("/qualification-options");
  return data;
}

export async function createQualificationOption(label: string): Promise<QualificationOption> {
  const { data } = await api.post("/qualification-options", { label });
  return data;
}

export async function updateQualificationOption(id: string, label: string): Promise<QualificationOption> {
  const { data } = await api.put(`/qualification-options/${id}`, { label });
  return data;
}

export async function deleteQualificationOption(id: string): Promise<void> {
  await api.delete(`/qualification-options/${id}`);
}

export async function getEmailDrafts(): Promise<EmailDraft[]> {
  const { data } = await api.get("/email-drafts");
  return data;
}

export async function createEmailDraft(draft: Pick<EmailDraft, "label" | "subject" | "message">): Promise<EmailDraft> {
  const { data } = await api.post("/email-drafts", draft);
  return data;
}

export async function updateEmailDraft(id: string, draft: Pick<EmailDraft, "label" | "subject" | "message">): Promise<EmailDraft> {
  const { data } = await api.put(`/email-drafts/${id}`, draft);
  return data;
}

export async function reorderEmailDrafts(ids: string[]): Promise<EmailDraft[]> {
  const { data } = await api.put("/email-drafts/order", { ids });
  return data;
}

export async function deleteEmailDraft(id: string): Promise<void> {
  await api.delete(`/email-drafts/${id}`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get("/dashboard/stats");
  return data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await api.get("/users");
  return data.users;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminUser> {
  const { data } = await api.post("/users", input);
  return data.user;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function updateMyProfile(name: string): Promise<AuthUser> {
  const { data } = await api.put("/users/me", { name });
  return data.user;
}

// ---------------------------------------------------------------- admin notifications

export async function getNotifications(limit = 20): Promise<{
  notifications: AdminNotification[];
  unreadCount: number;
}> {
  const { data } = await api.get("/notifications", { params: { limit } });
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get("/notifications/unread-count");
  return data.unreadCount;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}

export async function getAttentionSummary(): Promise<AttentionSummary> {
  const { data } = await api.get("/dashboard/attention");
  return data;
}

// ---------------------------------------------------------------- interview & follow-ups

export async function scheduleInterview(
  id: string,
  interview: { scheduledAt: string; mode?: string; venue?: string; link?: string; notes?: string; notify?: boolean }
): Promise<{ interview: Interview; notification: CandidateNotification | null; status?: string; statusChangedTo?: string | null }> {
  const { data } = await api.put(`/applications/${id}/interview`, interview);
  return data;
}

/** Re-send the interview date/time WhatsApp. */
export async function resendInterviewNotification(id: string): Promise<{
  notification: CandidateNotification | null;
  whatsappMessages: WhatsAppMessage[];
}> {
  const { data } = await api.post(`/applications/${id}/interview/notify`);
  return data;
}

export async function getJobPipeline(jobId: string): Promise<JobPipeline> {
  const { data } = await api.get(`/jobs/${jobId}/pipeline`);
  return data;
}

/** Close the job and move everyone still in progress to "Not Selected". */
export async function closeJobRemaining(jobId: string, notify: boolean): Promise<{ updated: number; notified: number }> {
  const { data } = await api.post(`/jobs/${jobId}/close-remaining`, { notify });
  return data;
}

export async function clearInterview(id: string): Promise<void> {
  await api.delete(`/applications/${id}/interview`);
}

export async function addFollowUp(
  id: string,
  input: { dueAt: string; note: string }
): Promise<FollowUp[]> {
  const { data } = await api.post(`/applications/${id}/follow-ups`, input);
  return data.followUps;
}

export async function updateFollowUp(
  id: string,
  followUpId: string,
  input: { done?: boolean; dueAt?: string }
): Promise<FollowUp[]> {
  const { data } = await api.patch(`/applications/${id}/follow-ups/${followUpId}`, input);
  return data.followUps;
}

export async function deleteFollowUp(id: string, followUpId: string): Promise<FollowUp[]> {
  const { data } = await api.delete(`/applications/${id}/follow-ups/${followUpId}`);
  return data.followUps;
}

// ---------------------------------------------------------------- export

/** Download the filtered application list as a CSV file (opens in Excel). */
export async function exportApplicationsCsv(params: {
  job?: string;
  status?: string;
  department?: string;
  search?: string;
}): Promise<void> {
  const { data, headers } = await api.get("/applications/export", {
    params,
    responseType: "blob",
  });
  const disposition = String(headers["content-disposition"] || "");
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] || "applications.csv";
  const url = URL.createObjectURL(data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------- resume

const fileNameFrom = (disposition: string, fallback: string) => {
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (star) {
    try {
      return decodeURIComponent(star);
    } catch {
      /* fall through */
    }
  }
  return /filename="([^"]+)"/i.exec(disposition)?.[1] || fallback;
};

async function fetchResume(id: string, inline: boolean) {
  const { data, headers } = await api.get(`/applications/${id}/resume`, {
    params: inline ? { inline: 1 } : undefined,
    responseType: "blob",
  });
  const name = fileNameFrom(String(headers["content-disposition"] || ""), "resume");
  return { blob: data as Blob, name };
}

/** Download the resume named like "FSD_Chaitanya.pdf". */
export async function downloadResume(id: string): Promise<void> {
  const { blob, name } = await fetchResume(id, false);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Open the resume in a new tab. PDFs open in the browser's viewer; Word files open in
 * Microsoft's online viewer. Call straight from a click handler so the tab isn't blocked.
 */
export async function viewResume(id: string, resumeUrl: string): Promise<void> {
  const isWord = /\.docx?($|\?)/i.test(resumeUrl);
  if (isWord && /^https?:\/\//i.test(resumeUrl)) {
    window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(resumeUrl)}`, "_blank", "noopener");
    return;
  }
  // Open the tab now (still inside the click) and fill it once the file arrives.
  const win = window.open("", "_blank");
  try {
    const { blob, name } = await fetchResume(id, true);
    if (isWord || !/pdf/i.test(blob.type)) {
      win?.close();
      return downloadResume(id);
    }
    const url = URL.createObjectURL(blob);
    if (!win) {
      window.location.assign(url);
      return;
    }
    win.document.title = name;
    win.document.body.style.margin = "0";
    const frame = win.document.createElement("iframe");
    frame.src = url;
    frame.title = name;
    frame.style.cssText = "border:0;width:100vw;height:100vh;display:block";
    win.document.body.appendChild(frame);
  } catch (err) {
    win?.close();
    throw err;
  }
}

// ---------------------------------------------------------------- document requests (admin)

export interface NewDocumentRequest {
  kind: "documents" | "joining";
  items: { label: string; required: boolean; hint?: string }[];
  wantBank: boolean;
  message?: string;
  expiresInDays?: number;
  notify?: boolean;
}

export async function createDocumentRequest(
  id: string,
  input: NewDocumentRequest
): Promise<{ requests: DocumentRequest[]; link: string; email: { status: string; error?: string } | null }> {
  const { data } = await api.post(`/applications/${id}/documents`, input);
  return data;
}

export async function reviewDocumentItem(
  id: string,
  rid: string,
  iid: string,
  input: { status: "approved" | "rejected" | "uploaded"; note?: string; notify?: boolean }
): Promise<{ requests: DocumentRequest[]; email?: { status: string; error?: string } | null }> {
  const { data } = await api.patch(`/applications/${id}/documents/${rid}/items/${iid}`, input);
  return data;
}

export async function remindDocumentRequest(
  id: string,
  rid: string
): Promise<{ requests: DocumentRequest[]; link: string; email: { status: string; error?: string } }> {
  const { data } = await api.post(`/applications/${id}/documents/${rid}/notify`);
  return data;
}

export async function revealBankAccount(id: string, rid: string): Promise<string> {
  const { data } = await api.get(`/applications/${id}/documents/${rid}/bank`);
  return data.account;
}

export async function deleteDocumentRequest(id: string, rid: string): Promise<{ requests: DocumentRequest[] }> {
  const { data } = await api.delete(`/applications/${id}/documents/${rid}`);
  return data;
}

// HR adding / updating documents themselves
type Requests = { requests: DocumentRequest[] };

export async function addDocumentItem(id: string, rid: string, input: { label: string; required?: boolean }): Promise<Requests> {
  const { data } = await api.post(`/applications/${id}/documents/${rid}/items`, input);
  return data;
}

export async function updateDocumentItem(id: string, rid: string, iid: string, input: { label?: string; required?: boolean }): Promise<Requests> {
  const { data } = await api.put(`/applications/${id}/documents/${rid}/items/${iid}`, input);
  return data;
}

export async function removeDocumentItem(id: string, rid: string, iid: string): Promise<Requests> {
  const { data } = await api.delete(`/applications/${id}/documents/${rid}/items/${iid}`);
  return data;
}

export async function adminUploadDocument(
  id: string,
  rid: string,
  iid: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<Requests> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/applications/${id}/documents/${rid}/items/${iid}/files`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  return data;
}

export async function adminRemoveDocumentFile(id: string, rid: string, iid: string, fid: string): Promise<Requests> {
  const { data } = await api.delete(`/applications/${id}/documents/${rid}/items/${iid}/files/${fid}`);
  return data;
}

export async function adminSaveBankDetails(
  id: string,
  rid: string,
  input: { holder: string; account?: string; ifsc: string; bankName: string; branch?: string; accountType: string }
): Promise<Requests> {
  const { data } = await api.put(`/applications/${id}/documents/${rid}/bank`, input);
  return data;
}

/** Fetch an uploaded document (decrypted by the server) as a blob + its friendly file name. */
export async function fetchDocumentFile(id: string, rid: string, fid: string, inline: boolean) {
  const { data, headers } = await api.get(`/applications/${id}/documents/${rid}/files/${fid}`, {
    params: inline ? { inline: 1 } : undefined,
    responseType: "blob",
  });
  return { blob: data as Blob, name: fileNameFrom(String(headers["content-disposition"] || ""), "document") };
}

// ---------------------------------------------------------------- document upload (candidate, public)

export async function getDocumentRequestByToken(token: string): Promise<CandidateDocumentView> {
  const { data } = await api.get(`/documents/${encodeURIComponent(token)}`);
  return data;
}

export async function uploadRequestedDocument(
  token: string,
  itemId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<CandidateDocumentView> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/documents/${encodeURIComponent(token)}/items/${itemId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  return data;
}

export async function removeRequestedDocument(token: string, itemId: string, fileId: string): Promise<CandidateDocumentView> {
  const { data } = await api.delete(`/documents/${encodeURIComponent(token)}/items/${itemId}/files/${fileId}`);
  return data;
}

export async function saveBankDetails(
  token: string,
  input: { holder: string; account: string; ifsc: string; bankName: string; branch: string; accountType: string }
): Promise<CandidateDocumentView> {
  const { data } = await api.post(`/documents/${encodeURIComponent(token)}/bank`, input);
  return data;
}

export async function submitRequestedDocuments(token: string): Promise<CandidateDocumentView> {
  const { data } = await api.post(`/documents/${encodeURIComponent(token)}/submit`);
  return data;
}

// ---------------------------------------------------------------- job alerts

export async function subscribeJobAlerts(input: {
  email: string;
  name?: string;
  departments?: string[];
}): Promise<{ status: "confirm-sent" | "already-subscribed" }> {
  const { data } = await api.post("/job-alerts/subscribe", input);
  return data;
}

export async function confirmJobAlerts(token: string): Promise<{ email: string; departments: string[]; manageToken: string }> {
  const { data } = await api.post("/job-alerts/confirm", { token });
  return data;
}

export async function getJobAlertSettings(token: string): Promise<{ email: string; name?: string; confirmed: boolean; departments: string[] }> {
  const { data } = await api.get(`/job-alerts/manage/${encodeURIComponent(token)}`);
  return data;
}

export async function updateJobAlertSettings(token: string, departments: string[]) {
  const { data } = await api.put(`/job-alerts/manage/${encodeURIComponent(token)}`, { departments });
  return data as { email: string; confirmed: boolean; departments: string[] };
}

export async function unsubscribeJobAlerts(token: string): Promise<void> {
  await api.post("/job-alerts/unsubscribe", { token });
}

export async function getJobAlertSubscribers(): Promise<{ total: number; confirmed: number; subscribers: JobAlertSubscriber[] }> {
  const { data } = await api.get("/job-alerts");
  return data;
}

export async function removeJobAlertSubscriber(id: string): Promise<void> {
  await api.delete(`/job-alerts/${id}`);
}

// ---------------------------------------------------------------- email

/** Admin-written email to the candidate. */
export async function sendApplicationEmail(
  id: string,
  input: { subject: string; message: string }
): Promise<{ email: EmailLog; emails: EmailLog[] }> {
  const { data } = await api.post(`/applications/${id}/email`, input);
  return data;
}

export async function getMailStatus(): Promise<MailStatus> {
  const { data } = await api.get("/mail/status");
  return data;
}

export async function sendTestEmail(to?: string): Promise<{ ok: boolean; error?: string; to: string; via?: string }> {
  try {
    const { data } = await api.post("/mail/test", to ? { to } : {});
    return data;
  } catch (err) {
    const e = err as { response?: { data?: { error?: string; to?: string } } };
    return { ok: false, error: e.response?.data?.error || "Could not send", to: e.response?.data?.to || to || "" };
  }
}

// ---------------------------------------------------------------- employees

export async function getEmployees(params: { q?: string; status?: string; department?: string } = {}): Promise<{
  employees: EmployeeListItem[];
  counts: { active: number; left: number; total: number };
}> {
  const { data } = await api.get("/employees", { params });
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await api.get(`/employees/${id}`);
  return data;
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const { data } = await api.post("/employees", input);
  return data;
}

export async function createEmployeeFromApplication(appId: string, input: EmployeeInput): Promise<Employee> {
  const { data } = await api.post(`/employees/from-application/${appId}`, input);
  return data;
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Employee> {
  const { data } = await api.put(`/employees/${id}`, input);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

export async function revealEmployeeField(id: string, field: "aadhaar" | "pan" | "account"): Promise<string> {
  const { data } = await api.get(`/employees/${id}/reveal/${field}`);
  return data.value;
}

export async function uploadEmployeeDocument(id: string, label: string, file: File, onProgress?: (pct: number) => void): Promise<Employee> {
  const form = new FormData();
  form.append("label", label);
  form.append("file", file);
  const { data } = await api.post(`/employees/${id}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  return data;
}

export async function renameEmployeeDocument(id: string, fid: string, label: string): Promise<Employee> {
  const { data } = await api.patch(`/employees/${id}/documents/${fid}`, { label });
  return data;
}

export async function deleteEmployeeDocument(id: string, fid: string): Promise<Employee> {
  const { data } = await api.delete(`/employees/${id}/documents/${fid}`);
  return data;
}

export async function fetchEmployeeDocument(id: string, fid: string, inline: boolean) {
  const { data, headers } = await api.get(`/employees/${id}/documents/${fid}`, {
    params: inline ? { inline: 1 } : undefined,
    responseType: "blob",
  });
  return { blob: data as Blob, name: fileNameFrom(String(headers["content-disposition"] || ""), "document") };
}
