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
export interface Document {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
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