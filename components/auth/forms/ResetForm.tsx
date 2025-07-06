"use client";

import { resetSchema } from "@/lib/auth/validation/auth-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { resetPassword } from "@/lib/auth/auth.actions";
import { toast } from "sonner";

export function ResetForm() {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof resetSchema>) => {
    setIsPending(true);

    resetPassword(values)
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
  return (
    <FormWrapper
      headerTitle="Reset your password"
      label="Enter your email address and we'll send you a reset link"
      buttonLabel="Remember your password?"
      buttonHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
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
          </div>
          <SubmitButton
            isPending={isPending}
            text="Send Reset Email"
            className="w-full"
          />
        </form>
      </Form>
    </FormWrapper>
  );
}
