import satellite from "@/lib/satellite";
import type { Response } from "@/types/response";

export interface User {
  id: string;
  title: string;
  username: string;
  password: string;
  created_at: string;
}

export const userService = {
  getAll: async () => {
    const response = await satellite.get<Response<User[]>>("/api/user/all");
    return response.data;
  },
  create: async (payload: {
    title: string;
    username: string;
    password: string;
  }) => {
    const response = await satellite.post<Response<User>>(
      "/api/user/create",
      payload,
    );
    return response.data;
  },
  update: async (
    id: string,
    payload: {
      title?: string;
      username?: string;
      password?: string;
    },
  ) => {
    const response = await satellite.put<Response<User>>(
      `/api/user/update/${encodeURIComponent(id)}`,
      payload,
    );
    return response.data;
  },
  remove: async (id: string) => {
    const response = await satellite.delete<Response<null>>(
      `/api/user/remove/${encodeURIComponent(id)}`,
    );
    return response.data;
  },
};
