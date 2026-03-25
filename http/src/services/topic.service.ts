import satellite from "@/lib/satellite";
import type { Response } from "@/types/response";

export type TopicType = "pub_to_sub" | "pub_to_api" | "api_to_sub";

export interface Topic {
  id: string;
  type: TopicType;
  name: string;
  method?: string | null;
  url?: string | null;
  origins?: string | null;
  user_id?: string | null;
  created_at: string;
}

export const topicService = {
  getAll: async () => {
    const response = await satellite.get<Response<Topic[]>>("/api/topic/all");
    return response.data;
  },
  create: async (payload: {
    type: TopicType;
    name: string;
    method?: string;
    url?: string;
    origins?: string[];
    user_id?: string;
  }) => {
    const response = await satellite.post<Response<Topic>>(
      "/api/topic/create",
      payload,
    );
    return response.data;
  },
  remove: async (id: string) => {
    const response = await satellite.delete<Response<null>>(
      `/api/topic/remove/${encodeURIComponent(id)}`,
    );
    return response.data;
  },
};
