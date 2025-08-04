import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 seconds for ultra-fresh data
      gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry timeouts, 4xx errors, or server busy errors
        if (error?.message?.includes('40') || 
            error?.message?.includes('timeout') || 
            error?.message?.includes('503') ||
            error?.message?.includes('BUSY')) return false;
        // Only retry once for other errors
        return failureCount < 1;
      },
      retryDelay: () => 200, // Very fast retry
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // No retries for mutations to avoid duplicate operations
        return false;
      },
      retryDelay: 200,
    },
  },
});
