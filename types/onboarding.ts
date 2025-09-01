export interface OnboardingFormData {
  // Personal Information
  name: string;
  birthdate?: string;
  location?: string;
  company?: string;
  designation?: string;
  companyaddress?: string;
  companywebsite?: string;
  status?: string;
  // AM assignment
  amId?: string;
  startDate?: string;
  dueDate?: string;
  profilePicture?: File;
  
  // Contact Information
  email?: string;
  phone?: string;
  password?: string;
  recoveryEmail?: string;
  
  // Website Information
  website?: string;
  website2?: string;
  website3?: string;
  
  // Biography
  biography?: string;
  
  // Image Gallery
  imageDrivelink?: string;
  
  // Social Media
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  
  // Package & Template
  packageId?: string;
  templateId?: string; // ✅ Added templateId field
  
  // Progress
  progress: number;
}

export interface StepProps {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}
