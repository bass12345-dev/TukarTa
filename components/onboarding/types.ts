export interface OnboardingData {
  selectedRoles: string[];
  stageName: string;
  bio: string;
  rate: string;
  rateType: string;
  useStageName: boolean;
  location: string;
  _lat?: string | null;
  _lng?: string | null;
  _fullLocation?: string;
  selectedGenres: string[];
  selectedAvailability: string[];
  avatarUri?: string;
}

export interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}
