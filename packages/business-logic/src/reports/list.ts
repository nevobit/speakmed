import { Collection, getModel } from "@repo/constant-definitions"
import { User, ReportSchemaMongo } from "@repo/entities"

export const getAllReports = async () => {
    const model = getModel<User>(Collection.REPORTS, ReportSchemaMongo)
    const reports = await model.find({});
    return reports;
}