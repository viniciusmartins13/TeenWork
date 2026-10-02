// Tipos espelhando os DTOs da API TeenWork (enums trafegam como texto).

export type Role = 'STUDENT' | 'COMPANY' | 'ADMIN';
export type WorkModel = 'OnSite' | 'Hybrid' | 'Remote';
export type JobType = 'Internship' | 'YoungApprentice' | 'FirstJob' | 'PartTime' | 'Course';
export type JobStatus = 'Active' | 'Inactive' | 'Closed';
export type ApplicationStatus = 'Pending' | 'UnderReview' | 'Accepted' | 'Rejected' | 'Cancelled';
export type ExperienceType = 'Job' | 'Internship' | 'Volunteer' | 'Project' | 'Course';
export type NotificationType = 'System' | 'ApplicationReceived' | 'ApplicationStatusChanged' | 'ApplicationCancelled';

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string | null;
  errors?: ApiFieldError[];
  data?: T;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  profileImage?: string | null;
  profileId?: number | null;
  companyName?: string | null;
  companyLogo?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'STUDENT' | 'COMPANY';
  city?: string;
  state?: string;
  school?: string;
  course?: string;
  companyName?: string;
  cnpj?: string;
  acceptTerms: boolean;
}

export interface JobSummary {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  companyLogo?: string | null;
  area: string;
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  salary?: number | null;
  vacancies: number;
  status: JobStatus;
  deadline?: string | null;
  createdAt: string;
  isSaved: boolean;
  hasApplied: boolean;
}

export interface JobCompany {
  id: number;
  companyName: string;
  logo?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  description?: string | null;
}

export interface JobDetails {
  id: number;
  title: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  area: string;
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  salary?: number | null;
  workload?: string | null;
  vacancies: number;
  status: JobStatus;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
  isOpenForApplications: boolean;
  company: JobCompany;
  isOwner: boolean;
  applicationsCount?: number | null;
  isSaved: boolean;
  myApplication?: { id: number; status: ApplicationStatus; createdAt: string } | null;
}

export interface CompanyJob {
  id: number;
  title: string;
  area: string;
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  salary?: number | null;
  vacancies: number;
  status: JobStatus;
  deadline?: string | null;
  isExpired: boolean;
  applicationsCount: number;
  pendingApplicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobPayload {
  title: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  area: string;
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  salary?: number | null;
  workload?: string | null;
  vacancies: number;
  deadline?: string | null;
}

export interface JobFilterOptions {
  areas: string[];
  locations: { city: string; state: string; jobsCount: number }[];
  maxSalary?: number | null;
}

export interface MyApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  companyId: number;
  companyName: string;
  companyLogo?: string | null;
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  jobStatus: JobStatus;
  status: ApplicationStatus;
  coverLetter?: string | null;
  companyFeedback?: string | null;
  canCancel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivedApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  studentId: number;
  studentName: string;
  studentPhoto?: string | null;
  city?: string | null;
  state?: string | null;
  school?: string | null;
  course?: string | null;
  schoolYear?: string | null;
  skills: string[];
  status: ApplicationStatus;
  coverLetter?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: number;
  title: string;
  organization: string;
  type: ExperienceType;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

export interface ExperiencePayload {
  title: string;
  organization: string;
  type: ExperienceType;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export interface StudentProfile {
  id: number;
  userId: number;
  name: string;
  email: string;
  profileImage?: string | null;
  school?: string | null;
  course?: string | null;
  schoolYear?: string | null;
  graduationYear?: number | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  skills: string[];
  portfolioUrl?: string | null;
  experiences: Experience[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfilePayload {
  name: string;
  school?: string | null;
  course?: string | null;
  schoolYear?: string | null;
  graduationYear?: number | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  skills: string[];
  portfolioUrl?: string | null;
}

export interface ApplicationDetails {
  id: number;
  status: ApplicationStatus;
  coverLetter?: string | null;
  companyFeedback?: string | null;
  canCancel: boolean;
  createdAt: string;
  updatedAt: string;
  job: { id: number; title: string; companyId: number; companyName: string; companyLogo?: string | null; status: JobStatus };
  student: StudentProfile;
}

export interface CompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  responsibleName: string;
  email?: string | null;
  description?: string | null;
  cnpj?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  logo?: string | null;
  activeJobsCount: number;
  createdAt: string;
}

export interface CompanyProfilePayload {
  responsibleName: string;
  companyName: string;
  description?: string | null;
  cnpj?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
}

export interface CompanySummary {
  id: number;
  companyName: string;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  logo?: string | null;
  description?: string | null;
  activeJobsCount: number;
}

export interface StatusCounts {
  pending: number;
  underReview: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}

export interface StudentDashboard {
  name: string;
  profileImage?: string | null;
  school?: string | null;
  course?: string | null;
  city?: string | null;
  state?: string | null;
  profileCompletion: { percentage: number; missingItems: string[] };
  totalApplications: number;
  applicationsByStatus: StatusCounts;
  savedJobsCount: number;
  unreadNotifications: number;
  recentApplications: MyApplication[];
}

export interface CompanyDashboard {
  companyName: string;
  logo?: string | null;
  totalJobs: number;
  activeJobs: number;
  inactiveJobs: number;
  closedJobs: number;
  totalApplications: number;
  applicationsByStatus: StatusCounts;
  unreadNotifications: number;
  recentApplications: ReceivedApplication[];
  topJobs: { id: number; title: string; applicationsCount: number; pendingCount: number }[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  students: number;
  companies: number;
  jobs: number;
  activeJobs: number;
  applications: number;
  acceptedApplications: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  userType: 'Student' | 'Company' | 'Admin';
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}
