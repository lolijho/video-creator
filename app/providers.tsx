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
            background: "#18182a",
            color: "#f0f0f8",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
          },
          success: {
            iconTheme: { primary: "#00e5a0", secondary: "#18182a" },
          },
          error: {
            iconTheme: { primary: "#ff5555", secondary: "#18182a" },
          },
        }}
      />
    </QueryClientProvider>
  );
}
