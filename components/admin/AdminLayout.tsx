"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AdminView } from "./AdminView";
import { AdminLoader } from "./AdminLoader";

export function AdminLayout() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <ErrorBoundary fallback={<AdminPageError />}>
        <AdminView />
      </ErrorBoundary>
    </Suspense>
  );
}

function AdminPageError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5">
        <h3 className="text-lg font-semibold mb-2">
          Error loading admin panel
        </h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the admin panel. Please try again later.
        </p>
      </div>
    </div>
  );
}
