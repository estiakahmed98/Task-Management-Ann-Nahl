//app/admin/clients/onboarding/page.tsx

"use client";

import { useState } from "react";
import { GeneralInfo } from "@/components/onboarding/general-info";
import { WebsiteInfo } from "@/components/onboarding/website-info";
import { SocialMediaInfo } from "@/components/onboarding/social-media-info";
import { ReviewInfo } from "@/components/onboarding/review-info";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { BiographyInfo } from "@/components/onboarding/biography-info";
import { ImageGallery } from "@/components/onboarding/image-gallery";
import { PackageInfo } from "@/components/onboarding/package-info";
import { TemplateSelection } from "@/components/onboarding/template-selection";
import type { OnboardingFormData } from "@/types/onboarding";

const steps = [
  { id: 1, title: "General Info", component: GeneralInfo },
  { id: 2, title: "Website Info", component: WebsiteInfo },
  { id: 3, title: "Biography", component: BiographyInfo },
  { id: 4, title: "Image Gallery", component: ImageGallery },
  { id: 5, title: "Social Media", component: SocialMediaInfo },
  { id: 6, title: "Package", component: PackageInfo },
  { id: 7, title: "Template", component: TemplateSelection },
  { id: 8, title: "Review", component: ReviewInfo },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: "",
    socialLinks: [],
    progress: 0,
  });

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const CurrentStepComponent = steps.find(
    (step) => step.id === currentStep
  )?.component;

  if (!CurrentStepComponent) {
    return <div>Step not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
      <div>
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 md:p-12">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onPrevious={previousStep}
          />
        </div>
      </div>
    </div>
  );
}
