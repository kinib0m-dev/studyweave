"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormSocials } from "./FormSocials";
import Image from "next/image";

interface FormWrapperProps {
  children: React.ReactNode;
  label: string;
  buttonHref: string;
  buttonLabel: string;
  showSocials?: boolean;
  headerTitle?: string;
}

export function FormWrapper({
  children,
  label,
  buttonHref,
  buttonLabel,
  showSocials = false,
  headerTitle,
}: FormWrapperProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/70 backdrop-blur-xl border-slate-600/40 shadow-2xl">
      <CardHeader className="space-y-4 pb-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Image
              src={"/icons/logo.png"}
              alt="StudyWeave logo"
              width={200}
              height={80}
            />
          </div>

          {/* Header text */}
          <div className="text-center space-y-2">
            {headerTitle && (
              <h1 className="text-2xl font-semibold text-white">
                {headerTitle}
              </h1>
            )}
            <p className="text-slate-300 text-sm leading-relaxed">{label}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        {showSocials && (
          <div className="space-y-4 mb-6">
            <FormSocials />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-500/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800/70 px-3 text-slate-400 font-medium">
                  or continue with email
                </span>
              </div>
            </div>
          </div>
        )}
        {children}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full text-center">
          <span className="text-sm text-slate-400">{buttonLabel} </span>
          <Button
            variant="link"
            className="p-0 h-auto text-blue-400 hover:text-blue-300 font-medium underline-offset-4"
            asChild
          >
            <Link href={buttonHref}>
              {buttonHref === "/login" ? "Sign in" : "Sign up"}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
