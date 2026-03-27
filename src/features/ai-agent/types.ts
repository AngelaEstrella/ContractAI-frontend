export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: Date;
};
