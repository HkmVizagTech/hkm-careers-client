export interface Department {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  title: string;
  slug: string;
  department: Department | string;
  location: string;
  type: "full-time" | "part-time" | "volunteer" | "intern";
  description: string;
  responsibilities: string;
  qualifications: string;
  experience: string;
  salaryRange: string;
  status: "draft" | "active" | "closed";
  askEducationalDetails?: boolean;
  targetGender?: 'any' | 'male' | 'female';
  applicationCount: number;
  postedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationNote {
  text: string;
  addedBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

export interface Application {
  _id: string;
  job: Job | string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  resumeKey?: string;
  coverLetter?: string;
  isExperienced?: boolean;
  yearsOfExperience?: number;
  lastEmployer?: string;
  lastEmploymentFrom?: string;
  lastEmploymentTo?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  location?: string;
  gender?: string;
  dateOfBirth?: string;
  availableToJoin?: string;
  currentLocation?: string;
  highestDegree?: string;
  collegeName?: string;
  collegeCity?: string;
  studyYears?: string;
  status:
    | "received"
    | "under-review"
    | "shortlisted"
    | "interview"
    | "selected"
    | "rejected";
  notes: ApplicationNote[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

export interface JobsResponse {
  jobs: Job[];
  pagination: PaginationInfo;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination: PaginationInfo;
}

export interface DashboardStats {
  openPositions: number;
  totalApplications: number;
  pendingReviews: number;
  recentApplications: Application[];
  applicationsByStatus: { status: string; count: number }[];
  applicationsByDepartment: { department: string; count: number }[];
}
