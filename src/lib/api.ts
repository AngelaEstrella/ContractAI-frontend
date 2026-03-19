// src/lib/api.ts
// Cliente API centralizado para ContractIA

import {
  LoginRequest,
  LoginResponse,
  User,
  UserCreateRequest,
  UserUpdateRequest,
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationWithContent,
  Document,
  DocumentCreateRequest,
  DocumentFileUrlResponse,
  DocumentUpdateRequest,
} from '@/types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Timeouts por tipo de operación (en milisegundos)
export const TIMEOUTS = {
  AUTH: 10000,      // 10 seg - login/logout
  DEFAULT: 30000,   // 30 seg - operaciones normales
  UPLOAD: 60000,    // 60 seg - subida de archivos
  AI: 120000,       // 120 seg - operaciones con IA (chatbot)
};

// ============================================
// FETCH BASE FUNCTION
// ============================================
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = TIMEOUTS.DEFAULT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Obtener token del localStorage si existe
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
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
}

// ============================================
// USER ENDPOINTS
// ============================================
export async function createUser(data: UserCreateRequest): Promise<User> {
  return fetchAPI<User>('/user', {
    method: 'POST',
    body: JSON.stringify(data),
  }, TIMEOUTS.DEFAULT);
}

export async function getUsers(): Promise<User[]> {
  return fetchAPI<User[]>('/user', {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
}

export async function getUserById(id: number): Promise<User> {
  return fetchAPI<User>(`/user/${id}`, {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
}

export async function updateUser(id: number, data: UserUpdateRequest): Promise<User> {
  return fetchAPI<User>(`/user/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, TIMEOUTS.DEFAULT);
}

export async function deleteUser(id: number): Promise<void> {
  return fetchAPI<void>(`/user/${id}`, {
    method: 'DELETE',
  }, TIMEOUTS.AUTH);
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

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

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La subida excedió el tiempo límite');
    }
    throw error;
  }
}

export async function getDocuments(): Promise<Document[]> {
  return fetchAPI<Document[]>('/documents', {
    method: 'GET',
  }, TIMEOUTS.DEFAULT);
}

export async function deleteDocument(id: number): Promise<void> {
  return fetchAPI<void>(`/documents/${id}`, {
    method: 'DELETE',
  }, TIMEOUTS.AUTH);
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
  return fetchAPI<Document>(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, TIMEOUTS.DEFAULT);
}
