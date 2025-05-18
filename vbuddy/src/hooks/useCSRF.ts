import { useState, useEffect, useCallback } from "react";

interface UseCSRFOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCSRF(options: UseCSRFOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 23 * 60 * 60 * 1000, // 23 hours (refresh before 24h expiry)
  } = options;

  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      const response = await fetch("/api/csrf", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const token = response.headers.get("x-csrf-token");
      if (!token) {
        throw new Error("CSRF token not found in response");
      }

      setCsrfToken(token);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      setCsrfToken(null);
    }
  }, []);

  // Initial token fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Auto refresh token
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchToken, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchToken]);

  // Function to get headers with CSRF token
  const getHeaders = useCallback(() => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }

    return headers;
  }, [csrfToken]);

  // Function to make a fetch request with CSRF token
  const fetchWithCSRF = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = getHeaders();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: "include",
      });

      // If we get a 403, it might be due to an expired CSRF token
      if (response.status === 403) {
        await fetchToken();
        // Retry the request with the new token
        return fetch(url, {
          ...options,
          headers: {
            ...getHeaders(),
            ...options.headers,
          },
          credentials: "include",
        });
      }

      return response;
    },
    [getHeaders, fetchToken]
  );

  return {
    csrfToken,
    error,
    getHeaders,
    fetchWithCSRF,
    refreshToken: fetchToken,
  };
}
