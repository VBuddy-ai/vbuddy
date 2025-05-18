interface VAProfile {
  full_name?: string;
  headline?: string;
  bio?: string;
  hourly_rate?: number;
  skills?: string[];
  experience?: string;
  portfolio_url?: string;
  profile_picture_url?: string;
  resume_url?: string;
}

interface EmployerProfile {
  full_name?: string;
  company_name?: string;
  company_description?: string;
  company_website?: string;
  company_logo_url?: string;
  industry?: string;
  company_size?: string;
  location?: string;
}

export const calculateVAProfileCompletion = (profile: VAProfile): number => {
  const requiredFields = [
    "full_name",
    "headline",
    "bio",
    "hourly_rate",
    "skills",
    "experience",
    "resume_url",
  ];

  const optionalFields = ["portfolio_url", "profile_picture_url"];

  const completedRequired = requiredFields.filter(
    (field) => profile[field as keyof VAProfile]
  ).length;

  const completedOptional = optionalFields.filter(
    (field) => profile[field as keyof VAProfile]
  ).length;

  // Required fields are worth 80% of completion
  const requiredPercentage = (completedRequired / requiredFields.length) * 80;

  // Optional fields are worth 20% of completion
  const optionalPercentage = (completedOptional / optionalFields.length) * 20;

  return Math.round(requiredPercentage + optionalPercentage);
};

export const calculateEmployerProfileCompletion = (
  profile: EmployerProfile
): number => {
  const requiredFields = [
    "full_name",
    "company_name",
    "company_description",
    "industry",
    "location",
  ];

  const optionalFields = [
    "company_website",
    "company_logo_url",
    "company_size",
  ];

  const completedRequired = requiredFields.filter(
    (field) => profile[field as keyof EmployerProfile]
  ).length;

  const completedOptional = optionalFields.filter(
    (field) => profile[field as keyof EmployerProfile]
  ).length;

  // Required fields are worth 80% of completion
  const requiredPercentage = (completedRequired / requiredFields.length) * 80;

  // Optional fields are worth 20% of completion
  const optionalPercentage = (completedOptional / optionalFields.length) * 20;

  return Math.round(requiredPercentage + optionalPercentage);
};
