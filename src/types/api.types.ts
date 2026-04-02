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
export type UserRole = 'admin' | 'worker';

export interface User {
  id: number;
  organization_id: number;
  supabase_user_id?: string | null;
  email: string;
  role: UserRole;
  full_name?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateRequest {
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active?: boolean;
}

export interface UserUpdateRequest {
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  is_active?: boolean;
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
export interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
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
export type DocumentType = 'SERVICES' | 'LICENSES' | 'SUPPORT';
export type DocumentState = 'ACTIVE' | 'PENDING' | 'EXPIRED';
export type CurrencyType = 'PEN' | 'USD' | 'EUR';

export interface DocumentFormData {
  value?: number;
  currency?: CurrencyType;
  [key: string]: unknown;
}

export interface DocumentServiceItemPayload {
  service_id: number;
  description?: string | null;
  value: number;
  currency: CurrencyType;
  start_date: string;
  end_date: string;
}

export interface DocumentServiceItem extends DocumentServiceItemPayload {
  id: number;
}

export interface ServiceCatalogItem {
  id: number;
  name: string;
}

export interface Document {
  id: number;
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  form_data: DocumentFormData;
  state: DocumentState;
  service_items: DocumentServiceItem[];
  file_path?: string | null;
  file_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreateRequest {
  file: File;
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  form_data: DocumentFormData;
  state?: DocumentState;
  service_items?: DocumentServiceItemPayload[];
}

export interface DocumentUpdateRequest {
  name?: string;
  client?: string;
  type?: DocumentType;
  start_date?: string;
  end_date?: string;
  form_data?: DocumentFormData;
  state?: DocumentState;
  service_items?: DocumentServiceItemPayload[];
  file?: File;
}

export interface DocumentFileUrlResponse {
  url: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificationType = "critical" | "warning" | "info";

export interface Notification {
  id: string;         // "contract-{doc_id}-{days}" — stable for localStorage
  document_id: number;
  type: NotificationType;
  title: string;
  description: string;
  days_remaining: number;
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
