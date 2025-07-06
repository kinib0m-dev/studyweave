"use client";

import { registerSchema } from "@/lib/auth/validation/auth-schemas";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { signUpAction } from "@/lib/auth/auth.actions";
import { toast } from "sonner";
import { FormWrapper } from "../FormWrapper";
import { SubmitButton } from "../SubmitButton";

export function RegisterForm() {
  const [type, setType] = useState<"text" | "password">("password");
  const [isPending, setIsPending] = useState(false);

  // Validation states
  const [lowerValidated, setLowerValidated] = useState(false);
  const [upperValidated, setUpperValidated] = useState(false);
  const [numberValidated, setNumberValidated] = useState(false);
  const [specialValidated, setSpecialValidated] = useState(false);
  const [lengthValidated, setLengthValidated] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const password = form.watch("password");

  // Calculate requirements met
  const getRequirementsMet = () => {
    const validations = [
      lowerValidated,
      upperValidated,
      numberValidated,
      specialValidated,
      lengthValidated,
    ];
    return validations.filter(Boolean).length;
  };

  const totalRequirements = 5;
  const requirementsMet = getRequirementsMet();
  const allRequirementsMet = requirementsMet === totalRequirements;

  useEffect(() => {
    const lower = /(?=.*[a-z])/;
    const upper = /(?=.*[A-Z])/;
    const number = /(?=.*[0-9])/;
    const special = /(?=.*[!@#$%*^&*\-_])/;
    const length = /.{8,}/;

    setLowerValidated(lower.test(password));
    setUpperValidated(upper.test(password));
    setNumberValidated(number.test(password));
    setSpecialValidated(special.test(password));
    setLengthValidated(length.test(password));
  }, [password]);

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    setIsPending(true);

    signUpAction(values)
      .then((data) => {
        if (!data?.success) {
          form.reset();
          toast.error(data?.message);
        }
        if (data?.success) {
          form.reset();
          toast.success(data?.message);
        }
      })
      .finally(() => setIsPending(false));
  };

  // Determine whether validation items should be visible
  const shouldShowValidation = password.length > 0 && !allRequirementsMet;

  return (
    <FormWrapper
      headerTitle="Create your account"
      label="Get started with your free account today"
      buttonLabel="Already have an account?"
      buttonHref="/login"
      showSocials
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200 font-medium">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Doe"
                      type="text"
                      disabled={isPending}
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                    />
                  </FormControl>
                  <FormMessage className="text-amber-400" />
                </FormItem>
              )}
            />
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200 font-medium">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="example@example.com"
                      type="email"
                      disabled={isPending}
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                    />
                  </FormControl>
                  <FormMessage className="text-amber-400" />
                </FormItem>
              )}
            />
            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200 font-medium">
                    Password
                  </FormLabel>
                  <div className="flex flex-row items-center">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Create a strong password"
                        type={type}
                        disabled={isPending}
                        className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 border-r-0 rounded-r-none"
                      />
                    </FormControl>
                    <span
                      onClick={() =>
                        setType((prev) =>
                          prev === "password" ? "text" : "password"
                        )
                      }
                      className="cursor-pointer bg-slate-800/50 border border-slate-600/50 border-l-0 p-2 rounded-r-lg h-11 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
                    >
                      {type === "password" ? (
                        <Eye className="size-5 text-slate-400" />
                      ) : (
                        <EyeOff className="size-5 text-slate-400" />
                      )}
                    </span>
                  </div>
                  <FormMessage className="text-amber-400" />
                </FormItem>
              )}
            />

            {/* Password Requirements */}
            {shouldShowValidation && (
              <div className="mt-2 bg-slate-800/30 p-4 rounded-lg border border-slate-600/30">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-600/30">
                  <span className="text-sm font-medium text-slate-200">
                    Password Requirements
                  </span>
                  <span className="text-sm font-medium text-emerald-400">
                    {requirementsMet}/{totalRequirements} completed
                  </span>
                </div>

                <div className="space-y-2">
                  <RequirementItem
                    text="At least one lowercase letter (a-z)"
                    isValid={lowerValidated}
                  />
                  <RequirementItem
                    text="At least one uppercase letter (A-Z)"
                    isValid={upperValidated}
                  />
                  <RequirementItem
                    text="At least one number (0-9)"
                    isValid={numberValidated}
                  />
                  <RequirementItem
                    text="At least one special character (!@#$%^&*)"
                    isValid={specialValidated}
                  />
                  <RequirementItem
                    text="Minimum 8 characters"
                    isValid={lengthValidated}
                  />
                </div>
              </div>
            )}
          </div>
          <SubmitButton
            isPending={isPending}
            text="Create account"
            className="w-full"
          />
        </form>
      </Form>
    </FormWrapper>
  );
}

// Component for individual requirement items
function RequirementItem({
  text,
  isValid,
}: {
  text: string;
  isValid: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
      )}
      <span
        className={`text-sm ${isValid ? "text-emerald-400" : "text-slate-400"}`}
      >
        {text}
      </span>
    </div>
  );
}
