import { api } from './api';
import type {
  AdminStats,
  AdminUser,
  ApplicationDetails,
  ApplicationStatus,
  AuthResponse,
  CompanyDashboard,
  CompanyJob,
  CompanyProfile,
  CompanyProfilePayload,
  CompanySummary,
  Experience,
  ExperiencePayload,
  JobDetails,
  JobFilterOptions,
  JobPayload,
  JobStatus,
  JobSummary,
  MyApplication,
  NotificationItem,
  Paged,
  ReceivedApplication,
  RegisterPayload,
  StudentDashboard,
  StudentProfile,
  StudentProfilePayload,
  User,
} from './types';

export interface JobSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  city?: string;
  state?: string;
  workModel?: string;
  jobType?: string;
  area?: string;
  minSalary?: number;
  maxSalary?: number;
  companyId?: number;
  sort?: string;
}

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResponse>('/api/auth/login', { email, password }),
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/api/auth/register', payload),
  me: () => api.get<User>('/api/auth/me'),
  forgotPassword: (email: string) => api.post<void>('/api/auth/forgot-password', { email }),
  resetPassword: (payload: { email: string; token: string; newPassword: string; confirmPassword: string }) =>
    api.post<void>('/api/auth/reset-password', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put<void>('/api/auth/change-password', payload),
};

export const jobsApi = {
  search: (params: JobSearchParams, signal?: AbortSignal) =>
    api.get<Paged<JobSummary>>('/api/jobs', { ...params }, signal),
  filters: (signal?: AbortSignal) => api.get<JobFilterOptions>('/api/jobs/filters', undefined, signal),
  get: (id: number, signal?: AbortSignal) => api.get<JobDetails>(`/api/jobs/${id}`, undefined, signal),
  create: (payload: JobPayload) => api.post<JobDetails>('/api/jobs', payload),
  update: (id: number, payload: JobPayload) => api.put<JobDetails>(`/api/jobs/${id}`, payload),
  setStatus: (id: number, status: JobStatus) => api.patch<JobDetails>(`/api/jobs/${id}/status`, { status }),
  remove: (id: number) => api.delete(`/api/jobs/${id}`),
  save: (id: number) => api.post<void>(`/api/jobs/${id}/save`),
  unsave: (id: number) => api.delete(`/api/jobs/${id}/save`),
  apply: (id: number, coverLetter?: string) =>
    api.post<MyApplication>(`/api/jobs/${id}/apply`, { coverLetter: coverLetter?.trim() || null }),
  applications: (id: number, params: { page?: number; pageSize?: number; status?: string; search?: string }, signal?: AbortSignal) =>
    api.get<Paged<ReceivedApplication>>(`/api/jobs/${id}/applications`, params, signal),
};

export const applicationsApi = {
  mine: (params: { page?: number; pageSize?: number; status?: string }, signal?: AbortSignal) =>
    api.get<Paged<MyApplication>>('/api/applications/my', params, signal),
  received: (params: { page?: number; pageSize?: number; status?: string; jobId?: number; search?: string }, signal?: AbortSignal) =>
    api.get<Paged<ReceivedApplication>>('/api/applications/received', params, signal),
  get: (id: number, signal?: AbortSignal) => api.get<ApplicationDetails>(`/api/applications/${id}`, undefined, signal),
  setStatus: (id: number, status: ApplicationStatus, feedback?: string) =>
    api.patch<ApplicationDetails>(`/api/applications/${id}/status`, { status, feedback: feedback?.trim() || null }),
  cancel: (id: number) => api.delete(`/api/applications/${id}`),
};

export const studentsApi = {
  me: (signal?: AbortSignal) => api.get<StudentProfile>('/api/students/me', undefined, signal),
  get: (id: number, signal?: AbortSignal) => api.get<StudentProfile>(`/api/students/${id}`, undefined, signal),
  update: (payload: StudentProfilePayload) => api.put<StudentProfile>('/api/students/profile', payload),
  addExperience: (payload: ExperiencePayload) => api.post<Experience>('/api/students/me/experiences', payload),
  updateExperience: (id: number, payload: ExperiencePayload) =>
    api.put<Experience>(`/api/students/me/experiences/${id}`, payload),
  removeExperience: (id: number) => api.delete(`/api/students/me/experiences/${id}`),
  recommended: (limit = 6, signal?: AbortSignal) =>
    api.get<JobSummary[]>('/api/students/me/recommended-jobs', { limit }, signal),
  savedJobs: (params: { page?: number; pageSize?: number }, signal?: AbortSignal) =>
    api.get<Paged<JobSummary>>('/api/saved-jobs', params, signal),
};

export const companiesApi = {
  search: (params: { page?: number; pageSize?: number; search?: string; state?: string; onlyHiring?: boolean }, signal?: AbortSignal) =>
    api.get<Paged<CompanySummary>>('/api/companies', params, signal),
  get: (id: number, signal?: AbortSignal) => api.get<CompanyProfile>(`/api/companies/${id}`, undefined, signal),
  me: (signal?: AbortSignal) => api.get<CompanyProfile>('/api/companies/me', undefined, signal),
  update: (payload: CompanyProfilePayload) => api.put<CompanyProfile>('/api/companies/profile', payload),
  myJobs: (params: { page?: number; pageSize?: number; search?: string; status?: string }, signal?: AbortSignal) =>
    api.get<Paged<CompanyJob>>('/api/companies/me/jobs', params, signal),
};

export const dashboardApi = {
  student: (signal?: AbortSignal) => api.get<StudentDashboard>('/api/dashboard/student', undefined, signal),
  company: (signal?: AbortSignal) => api.get<CompanyDashboard>('/api/dashboard/company', undefined, signal),
};

export const notificationsApi = {
  list: (params: { page?: number; pageSize?: number; unreadOnly?: boolean }, signal?: AbortSignal) =>
    api.get<Paged<NotificationItem>>('/api/notifications', params, signal),
  unreadCount: (signal?: AbortSignal) => api.get<{ count: number }>('/api/notifications/unread-count', undefined, signal),
  markRead: (id: number) => api.patch<void>(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch<void>('/api/notifications/read-all'),
  remove: (id: number) => api.delete(`/api/notifications/${id}`),
};

export const mediaApi = {
  uploadPhoto: (file: File) => api.upload<{ url: string }>('/api/users/me/photo', file),
  removePhoto: () => api.delete('/api/users/me/photo'),
  uploadLogo: (file: File) => api.upload<{ url: string }>('/api/companies/me/logo', file),
  removeLogo: () => api.delete('/api/companies/me/logo'),
};

export const adminApi = {
  stats: (signal?: AbortSignal) => api.get<AdminStats>('/api/admin/stats', undefined, signal),
  users: (params: { page?: number; pageSize?: number; search?: string; userType?: string }, signal?: AbortSignal) =>
    api.get<Paged<AdminUser>>('/api/admin/users', params, signal),
  setActive: (id: number, isActive: boolean) => api.patch<void>(`/api/admin/users/${id}/status`, { isActive }),
};
