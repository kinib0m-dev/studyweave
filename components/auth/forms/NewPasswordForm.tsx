"use client";

import { newPasswordSchema } from "@/lib/auth/validation/auth-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormWrapper } from "@/components/auth/FormWrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { newPassword } from "@/lib/auth/auth.actions";
import { toast } from "sonner";

export function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") as string;

  const [type, setType] = useState<"text" | "password">("password");
  const [isPending, setIsPending] = useState(false);

  // Validation states
  const [lowerValidated, setLowerValidated] = useState(false);
  const [upperValidated, setUpperValidated] = useState(false);
  const [numberValidated, setNumberValidated] = useState(false);
  const [specialValidated, setSpecialValidated] = useState(false);
  const [lengthValidated, setLengthValidated] = useState(false);

  const form = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
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

  const onSubmit = (values: z.infer<typeof newPasswordSchema>) => {
    setIsPending(true);

    newPassword(values, token)
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
      label="Reset Password"
      buttonLabel="Back to login"
      buttonHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="flex flex-row items-center">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="*******"
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
                        <Eye className="size-5" />
                      ) : (
                        <EyeOff className="size-5" />
                      )}
                    </span>
                  </div>
                  <FormMessage className="text-amber-400" />
                </FormItem>
              )}
            />
            {/* Password Requirements */}
            {shouldShowValidation && (
              <div className="mt-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <span className="text-sm font-medium">
                    Password Requirements
                  </span>
                  <span className="text-sm font-medium">
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
            text="Reset Password"
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
