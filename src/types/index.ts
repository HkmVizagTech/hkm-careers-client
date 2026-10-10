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
  /** Ticked qualification checkboxes, e.g. ["B.Tech", "Post Graduation"]. */
  qualificationTags?: string[];
  /** 'text' = pasted free text (headings, bullets, paragraphs). Missing on older jobs: one bullet per line. */
  descriptionFormat?: 'points' | 'text';
  experience: string;
  salaryRange: string;
  status: "draft" | "active" | "closed";
  askEducationalDetails?: boolean;
  targetGender?: 'any' | 'male' | 'female';
  /** How many people will be hired; the job closes when this many are Selected. */
  openings?: number;
  /** Last day to apply (end of that day, India time). The job closes itself after it. */
  deadline?: string | null;
  applicationCount: number;
  postedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualificationOption {
  _id: string;
  label: string;
  order: number;
}

export interface ApplicationNote {
  text: string;
  addedBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
}

export type WhatsAppDeliveryStatus =
  | "submitted"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped";

export interface WhatsAppMessage {
  _id: string;
  kind: "received" | "status" | "interview";
  applicationStatus?: string;
  to?: string;
  messageId?: string;
  status: WhatsAppDeliveryStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type InterviewMode = "in-person" | "phone" | "video";

export interface Interview {
  scheduledAt: string;
  mode?: InterviewMode;
  /** Venue name (in person) or call details (phone) */
  venue?: string;
  /** Google Maps link (in person) or meeting link (video) */
  link?: string;
  /** Older interviews: venue + link in one text */
  location?: string;
  notes?: string;
}

export interface FollowUp {
  _id: string;
  dueAt: string;
  note: string;
  done: boolean;
  notifiedAt?: string | null;
  createdBy?: { _id: string; name: string } | string;
  createdAt: string;
}

export type AdminNotificationType =
  | "new-application"
  | "unreviewed"
  | "interview"
  | "job-closing"
  | "job-closed"
  | "follow-up"
  | "position-filled";

export interface AdminNotification {
  _id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface RoleFilled {
  jobId: string;
  title: string;
  openings: number;
  selected: number;
  remaining: number;
  closedNow: boolean;
}

export interface JobPipeline {
  jobId: string;
  title: string;
  status: "draft" | "active" | "closed";
  openings: number;
  selected: number;
  remaining: number;
}

export interface AttentionSummary {
  unreviewedDays: number;
  unreviewedCount: number;
  unreviewed: (Pick<Application, "_id" | "name" | "applicationNumber" | "createdAt"> & { job: { title: string } | null })[];
  interviews: (Pick<Application, "_id" | "name" | "applicationNumber"> & { interview: Interview; job: { title: string } | null })[];
  closingJobs: { _id: string; title: string; deadline: string; applicationCount: number }[];
  followUps: {
    _id: string;
    applicationId: string;
    name: string;
    applicationNumber?: string;
    note: string;
    dueAt: string;
    overdue: boolean;
  }[];
}

export type EmailKind = "received" | "status" | "interview" | "custom" | "hr-new-application";

export interface EmailLog {
  _id: string;
  kind: EmailKind;
  applicationStatus?: string;
  to?: string;
  subject?: string;
  body?: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  sentBy?: { _id: string; name: string } | string | null;
  createdAt: string;
}

/** Result of a WhatsApp attempt, with the matching email attempt attached. */
export type CandidateNotification = WhatsAppMessage & { email?: Pick<EmailLog, "status" | "error"> };

export interface MailStatus {
  configured: boolean;
  via: "gmail-api" | "smtp" | null;
  from: string | null;
  replyTo: string | null;
  hrRecipients: string[];
}

export interface Application {
  _id: string;
  applicationNumber?: string;
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
  whatsappMessages?: WhatsAppMessage[];
  emails?: EmailLog[];
  interview?: Interview | null;
  followUps?: FollowUp[];
  /** Where the applicant found the job: linkedin, indeed, whatsapp... */
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
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
