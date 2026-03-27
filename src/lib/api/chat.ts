import type {
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationWithContent,
} from "@/types/api.types";
import { TIMEOUTS } from "./constants";
import { fetchAPI } from "./fetch-client";

export async function sendMessage(data: ChatRequest): Promise<ChatResponse> {
  return fetchAPI<ChatResponse>(
    "/chatbot/",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    TIMEOUTS.AI,
  );
}

export async function getConversations(): Promise<Conversation[]> {
  return fetchAPI<Conversation[]>(
    "/conversations",
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  );
}

export async function getConversationById(id: number): Promise<ConversationWithContent> {
  return fetchAPI<ConversationWithContent>(
    `/conversations/${id}`,
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  );
}
