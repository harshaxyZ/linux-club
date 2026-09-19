/** Shape of a row in public.applications as the admin console consumes it. */
export interface Application {
  id: string;
  full_name: string;
  usn: string;
  year: string;
  course: string;
  section: string;
  email: string;
  phone: string;
  github_url?: string | null;
  linkedin_url?: string | null;
  languages?: string[] | null;
  extra_links?: Array<{ label: string; url: string }> | null;
  about_text: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  created_at: string;
}

export type ApplicationStatus = Application['status'];
