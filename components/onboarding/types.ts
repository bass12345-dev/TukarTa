export interface OnboardingData {
  selectedRoles: string[];
  stageName: string;
  bio: string;
  rate: string;
  rateType: string;
  useStageName: boolean;
  location: string;
  selectedGenres: string[];
  selectedAvailability: string[];
}

export interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}
