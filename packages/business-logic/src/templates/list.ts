import { Collection, getModel } from "@repo/constant-definitions"
import { User, TemplateSchemaMongo } from "@repo/entities"

export const getAllTemplates = async () => {
    const model = getModel<User>(Collection.TEMPLATES, TemplateSchemaMongo)
    const templates = await model.find({});
    return templates;
}