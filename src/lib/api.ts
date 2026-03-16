const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Timeouts por tipo de operación (en milisegundos)
export const TIMEOUTS = {
  AUTH: 3000,       // 3 seg - login/logout
  DEFAULT: 3000,    // 3 seg - operaciones normales
  UPLOAD: 10000,    // 10 seg - subida de archivos
  AI: 10000,        // 10 seg - operaciones con IA (chatbot)
};

// Función base para todas las peticiones
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = TIMEOUTS.DEFAULT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la petición');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La petición excedió el tiempo límite');
    }
    throw error;
  }
}