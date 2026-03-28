import type { Notification } from "@/types/api.types";
import { fetchAPI } from "./fetch-client";

export async function getNotifications(): Promise<Notification[]> {
  return fetchAPI<Notification[]>("/notifications/", { method: "GET", cache: "no-store" });
}
