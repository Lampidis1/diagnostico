export type ProfileDemand = {
  id: string;
  name: string;
  category: string;
  requirements: string[];
  requirementOther: string;
  technicalCompetencies: string;
  experience: string;
  studyType: string;
  educationLevel: string;
  shiftSystem: string;
  genderPreference: string;
  quantity: number;
  behaviours: string[];
};

export type DiagnosticPayload = {
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
  sector: string;
  sectorOther: string;
  companySize: string;
  commune: string;
  communeOther: string;
  demandTiming: string;
  profiles: ProfileDemand[];
  hasGaps: string;
  gapDetails: string;
  wantsSupport: string;
  contactConsent: string;
  comments: string;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "viewer";
  active: boolean;
  created_at: string;
};

export type EmailCampaignListItem = {
  id: string;
  subject: string;
  template: string;
  recipient_count: number;
  status: "sent" | "failed";
  error: string | null;
  created_at: string;
};
