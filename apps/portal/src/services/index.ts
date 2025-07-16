import { apiInstance } from "@/api"
import { User } from "@repo/entities";

export const getCurrentUser = async (): Promise<User> => {
    const { data } = await apiInstance.get("/user");
    return data;
}