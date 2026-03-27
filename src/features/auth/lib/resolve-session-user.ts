import type { Session } from "@supabase/supabase-js";
import {
  mapBackendUserToAuthUser,
  mapSupabaseUserToAuthUser,
  type AuthDisplayUser,
} from "@/lib/authUser";
import { getCurrentUser } from "@/lib/api";

export const resolveSessionUser = async (session: Session): Promise<AuthDisplayUser> => {
  try {
    const backendUser = await getCurrentUser();
    return mapBackendUserToAuthUser(backendUser);
  } catch {
    return mapSupabaseUserToAuthUser(session.user);
  }
};
