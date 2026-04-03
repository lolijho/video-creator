"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#2e302a",
            color: "#E6D2B5",
            border: "1px solid rgba(230,210,181,0.10)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#2BA68F", secondary: "#2e302a" },
          },
          error: {
            iconTheme: { primary: "#E54040", secondary: "#2e302a" },
          },
        }}
      />
    </QueryClientProvider>
  );
}
