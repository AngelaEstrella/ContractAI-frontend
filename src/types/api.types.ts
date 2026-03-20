// src/types/api.types.ts
// Tipos TypeScript para la API de ContractIA

// ============================================
// AUTH TYPES
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================
// USER TYPES
// ============================================
export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name?: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  password?: string;
}

// ============================================
// CHATBOT TYPES
// ============================================
export interface ChatRequest {
  message: string;
  thread_id?: number;
}

export interface ChatResponse {
  response: string;
  thread_id: number;
}

// ============================================
// CONVERSATION TYPES
// ============================================
export type MessageSender = 'user' | 'bot';

export interface ConversationMessage {
  sender: MessageSender;
  message: string;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

export interface ConversationWithContent extends Conversation {
  content: ConversationMessage[];
}

// ============================================
// DOCUMENT TYPES
// ============================================
export type DocumentType = 'SERVICIOS' | 'LICENCIAS' | 'SOPORTE';
export type DocumentState = 'ACTIVO' | 'POR_VENCER' | 'EXPIRADO';

export interface Document {
  id: number;
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  value: number;
  currency: string;
  licenses: number;
  state: DocumentState;
  file_path?: string | null;
  file_name?: string | null;
}

export interface DocumentCreateRequest {
  file: File;
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  value: number;
  currency: string;
  licenses: number;
}

export interface DocumentUpdateRequest {
  name?: string;
  client?: string;
  type?: DocumentType;
  start_date?: string;
  end_date?: string;
  value?: number;
  currency?: string;
  licenses?: number;
  file?: File;
}

export interface DocumentFileUrlResponse {
  url: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiState<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
}
