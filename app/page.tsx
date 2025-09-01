"use client";

import { LoginForm } from "./(main)/auth/sign-in/login-form";
import { BackgroundLines } from "@/components/ui/background-lines";
import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function LoginPage() {
  return (
    <BackgroundLines className="min-h-svh flex items-center justify-center px-6 py-10">
      <BackgroundGradient containerClassName="w-full max-w-sm rounded-xl">
        <LoginForm />
      </BackgroundGradient>
    </BackgroundLines>
  );
}
