"use client";

import { loginSchema } from "@/lib/auth/validation/auth-schemas";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { signInAction } from "@/lib/auth/auth.actions";
import { FormWrapper } from "../FormWrapper";
import { SubmitButton } from "../SubmitButton";

export function LoginForm() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setIsPending(true);

    signInAction(values)
      .then((data) => {
        if (data?.twoFactor) {
          setShowTwoFactor(true);
          toast.info("Please enter your two-factor authentication code");
        } else if (data?.success) {
          form.reset();
          toast.success(data?.message);
        } else if (!data?.success) {
          if (!data?.twoFactor) {
            form.reset();
          }
          if (data?.message) {
            toast.error(data?.message);
          }
        }
      })
      .finally(() => setIsPending(false));
  };

  return (
    <FormWrapper
      headerTitle="Welcome back"
      label="Sign in to your account to continue learning"
      buttonLabel="Don't have an account?"
      buttonHref="/register"
      showSocials
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {!showTwoFactor && (
              <>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200 font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your password"
                          type="password"
                          disabled={isPending}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-amber-400" />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 h-auto text-blue-400 hover:text-blue-300 font-medium underline-offset-4"
                    asChild
                  >
                    <Link href="/reset">Forgot your password?</Link>
                  </Button>
                </div>
              </>
            )}
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200 font-medium">
                      Two Factor Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456"
                        disabled={isPending}
                        className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                      />
                    </FormControl>
                    <FormMessage className="text-amber-400" />
                  </FormItem>
                )}
              />
            )}
          </div>
          <SubmitButton
            isPending={isPending}
            text={showTwoFactor ? "Confirm" : "Sign in"}
            className="w-full "
          />
        </form>
      </Form>
    </FormWrapper>
  );
}
