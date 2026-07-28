import api from "@/lib/api";
import type {
  Job,
  JobsResponse,
  Application,
  ApplicationsResponse,
  Department,
  DashboardStats,
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
  status: string
): Promise<Application> {
  const { data } = await api.patch(`/applications/${id}/status`, {
    status,
  });
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
