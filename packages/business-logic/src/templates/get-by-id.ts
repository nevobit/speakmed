import { Collection, getModel } from "@repo/constant-definitions"
import { Template, TemplateSchemaMongo } from "@repo/entities"

export const getTemplateById = async (id: string) => {
    const model = getModel<Template>(Collection.TEMPLATES, TemplateSchemaMongo)

    const template = await model.find({});
    console.log(template, id)
    return template[0];
}