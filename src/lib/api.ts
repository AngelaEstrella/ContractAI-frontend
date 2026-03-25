// src/lib/api.ts
// Cliente API centralizado para ContractIA

import {
  LoginRequest,
  LoginResponse,
  User,
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationWithContent,
  Document,
  DocumentCreateRequest,
  DocumentFileUrlResponse,
  DocumentUpdateRequest,
} from '@/types/api.types';
import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Timeouts por tipo de operación (en milisegundos)
export const TIMEOUTS = {
  AUTH: 10000,      // 10 seg - login/logout
  DEFAULT: 30000,   // 30 seg - operaciones normales
  UPLOAD: 60000,    // 60 seg - subida de archivos
  AI: 120000,       // 120 seg - operaciones con IA (chatbot)
};

const DOCUMENTS_CACHE_TTL_MS = 15_000;
const CURRENT_USER_CACHE_TTL_MS = 15_000;

let documentsCache: { data: Document[]; timestamp: number } | null = null;
let documentsInFlight: Promise<Document[]> | null = null;
let currentUserCache: { data: User; timestamp: number } | null = null;
let currentUserInFlight: Promise<User> | null = null;

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    localStorage.setItem('access_token', session.access_token);
    return session.access_token;
  }

  return localStorage.getItem('access_token');
}

// ============================================
// FETCH BASE FUNCTION
// ============================================
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = TIMEOUTS.DEFAULT,
  includeAuth: boolean = true
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const token = includeAuth ? await getAccessToken() : null;
  const headers = new Headers(options.headers ?? {});
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || 'Error en la petición');
    }

    // Si es 204 No Content, retornar null
    if (response.status === 204) {
      return null as T;
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

// ============================================
// AUTH ENDPOINTS
// ============================================
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetchAPI<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }, TIMEOUTS.AUTH);

  // Guardar token en localStorage
  if (response.access_token) {
    localStorage.setItem('access_token', response.access_token);
  }

  return response;
}

export function logout(): void {
  localStorage.removeItem('access_token');
  currentUserCache = null;
  currentUserInFlight = null;
  documentsCache = null;
  documentsInFlight = null;
}

export async function getCurrentUser(): Promise<User> {
  if (currentUserCache && Date.now() - currentUserCache.timestamp < CURRENT_USER_CACHE_TTL_MS) {
    return currentUserCache.data;
  }

  if (currentUserInFlight) {
    return currentUserInFlight;
  }

  currentUserInFlight = fetchAPI<User>('/user/me', {
    method: 'GET',
  }, TIMEOUTS.DEFAULT)
    .then((user) => {
      currentUserCache = { data: user, timestamp: Date.now() };
      return user;
    })
    .finally(() => {
      currentUserInFlight = null;
    });

  return currentUserInFlight;
}

// ============================================
// CHATBOT ENDPOINTS
// ============================================
export async function sendMessage(data: ChatRequest): Promise<ChatResponse> {
  return fetchAPI<ChatResponse>('/chatbot/', {
    method: 'POST',
    body: JSON.stringify(data),
  }, TIMEOUTS.AI);
}

// ============================================
// CONVERSATION ENDPOINTS
// ============================================
export async function getConversations(): Promise<Conversation[]> {
  return fetchAPI<Conversation[]>('/conversations', {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
}

export async function getConversationById(id: number): Promise<ConversationWithContent> {
  return fetchAPI<ConversationWithContent>(`/conversations/${id}`, {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
}

// ============================================
// DOCUMENT ENDPOINTS
// ============================================
export async function uploadDocument(data: DocumentCreateRequest): Promise<Document> {
  const formData = new FormData();
  formData.append('file', data.file);
  
  // El backend espera 'document' como un string JSON
  const documentData = {
    name: data.name,
    client: data.client,
    type: data.type,
    start_date: data.start_date,
    end_date: data.end_date,
    value: data.value,
    currency: data.currency,
    licenses: data.licenses,
  };
  formData.append('document', JSON.stringify(documentData));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.UPLOAD);

  const token = await getAccessToken();

  try {
    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al subir documento');
    }

    const createdDocument = await response.json();
    documentsCache = null;
    documentsInFlight = null;
    return createdDocument;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La subida excedió el tiempo límite');
    }
    throw error;
  }
}

export async function getDocuments(): Promise<Document[]> {
  if (documentsCache && Date.now() - documentsCache.timestamp < DOCUMENTS_CACHE_TTL_MS) {
    return documentsCache.data;
  }

  if (documentsInFlight) {
    return documentsInFlight;
  }

  documentsInFlight = fetchAPI<Document[]>('/documents/', {
    method: 'GET',
  }, TIMEOUTS.DEFAULT)
    .then((documents) => {
      documentsCache = { data: documents, timestamp: Date.now() };
      return documents;
    })
    .finally(() => {
      documentsInFlight = null;
    });

  return documentsInFlight;
}

export async function deleteDocument(id: number): Promise<void> {
  const result = await fetchAPI<void>(`/documents/${id}`, {
    method: 'DELETE',
  }, TIMEOUTS.AUTH);

  documentsCache = null;
  documentsInFlight = null;
  return result;
}

export async function getDocumentById(id: number): Promise<Document> {
  return fetchAPI<Document>(`/documents/${id}`, {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
}

export async function getDocumentFileUrl(id: number): Promise<string> {
  const response = await fetchAPI<DocumentFileUrlResponse>(`/documents/${id}/file-url`, {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
  return response.url;
}

export async function updateDocument(id: number, data: DocumentUpdateRequest): Promise<Document> {
  const formData = new FormData();

  if (data.file) {
    formData.append('file', data.file);
  }

  const documentData = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.client !== undefined && { client: data.client }),
    ...(data.type !== undefined && { type: data.type }),
    ...(data.start_date !== undefined && { start_date: data.start_date }),
    ...(data.end_date !== undefined && { end_date: data.end_date }),
    ...(data.value !== undefined && { value: data.value }),
    ...(data.currency !== undefined && { currency: data.currency }),
    ...(data.licenses !== undefined && { licenses: data.licenses }),
  };
  formData.append('document', JSON.stringify(documentData));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.UPLOAD);

  const token = await getAccessToken();

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'PATCH',
      body: formData,
      signal: controller.signal,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || 'Error al actualizar documento');
    }

    const updatedDocument = await response.json();
    documentsCache = null;
    documentsInFlight = null;
    return updatedDocument;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La actualización excedió el tiempo límite');
    }
    throw error;
  }
}
