import { getApiBaseUrl, TIMEOUTS } from "./constants";
import { getAccessToken } from "./token-store";

const createAbortTimeout = (timeout: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return {
    controller,
    clear: () => clearTimeout(timeoutId),
  };
};

const readResponseError = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const errorData = (await response.json()) as {
        detail?: string;
        message?: string;
      };

      return errorData.detail || errorData.message || `Error ${response.status}`;
    }

    const text = await response.text();
    return text || `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
};

const throwIfRequestFailed = async (response: Response): Promise<void> => {
  if (!response.ok) {
    throw new Error(await readResponseError(response));
  }
};

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = TIMEOUTS.DEFAULT,
  includeAuth: boolean = true,
): Promise<T> {
  const { controller, clear } = createAbortTimeout(timeout);
  const token = includeAuth ? await getAccessToken() : null;
  const headers = new Headers(options.headers ?? {});
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clear();
    await throwIfRequestFailed(response);

    if (response.status === 204) {
      return null as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clear();

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La peticion excedio el tiempo limite");
    }

    throw error;
  }
}

export async function fetchWithFormData<T>(
  endpoint: string,
  method: "POST" | "PATCH",
  formData: FormData,
  timeout: number = TIMEOUTS.UPLOAD,
): Promise<T> {
  const { controller, clear } = createAbortTimeout(timeout);
  const token = await getAccessToken();

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method,
      body: formData,
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    clear();
    await throwIfRequestFailed(response);
    return response.json() as Promise<T>;
  } catch (error) {
    clear();

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        method === "POST"
          ? "La subida excedio el tiempo limite"
          : "La actualizacion excedio el tiempo limite",
      );
    }

    throw error;
  }
}
