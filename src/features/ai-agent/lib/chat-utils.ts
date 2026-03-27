import type { ConversationWithContent } from "@/types/api.types";
import type { ChatMessage } from "@/features/ai-agent/lib/chat.types";

export const CHAT_SUGGESTIONS = [
  "¿Que puedes hacer?",
  "Analizar un contrato",
  "Explicar una clausula",
] as const;

export const formatConversationDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const isRecentTimestamp = (timestamp: Date, now: Date): boolean => {
  return now.getTime() - timestamp.getTime() < 60_000;
};

export const mapConversationToMessages = (
  conversation: ConversationWithContent,
): ChatMessage[] => {
  return conversation.content.map((message, index) => ({
    id: `loaded-${index}`,
    sender: message.sender === "user" ? "user" : "bot",
    content: message.message,
    timestamp: new Date(conversation.created_at),
  }));
};
