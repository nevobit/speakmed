import { Collection, getModel } from "@repo/constant-definitions"
import { User, UserSchemaMongo } from "@repo/entities"

export const getUserById = async (id: string): Promise<User> => {
    const model = getModel<User>(Collection.USERS, UserSchemaMongo)
    const user = await model.findById(id).select("-password") as User;
    return user;
}