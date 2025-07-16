import { getCurrentUser } from "@/services";
import { User } from "@repo/entities";
import { useSuspenseQuery } from "@tanstack/react-query"

export const useUser = () => {
    const { isLoading, data: user } = useSuspenseQuery<User>({
        queryKey: ["user"],
        queryFn: getCurrentUser
    });

    return { isLoading, user }
}