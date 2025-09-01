export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in days
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Add any other fields that your Package type should have
}
