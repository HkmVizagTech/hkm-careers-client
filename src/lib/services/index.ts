import api from "@/lib/api";
import type {
  Job,
  JobsResponse,
  Application,
  ApplicationsResponse,
  WhatsAppMessage,
  Department,
  DashboardStats,
  AdminUser,
  AuthUser,
  AdminNotification,
  AttentionSummary,
  Interview,
  FollowUp,
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
): Promise<Application & { notification?: WhatsAppMessage | null }> {
  const { data } = await api.patch(`/applications/${id}/status`, {
    status,
    notify,
  });
  return data;
}

/** Re-send the WhatsApp message that matches the application's current status. */
export async function resendApplicationNotification(id: string): Promise<{
  notification: WhatsAppMessage | null;
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
  interview: { scheduledAt: string; mode?: string; location?: string; notes?: string }
): Promise<Interview> {
  const { data } = await api.put(`/applications/${id}/interview`, interview);
  return data.interview;
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
