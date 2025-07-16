import { Collection, getModel } from "@repo/constant-definitions"
import { ReportSchemaMongo } from "@repo/entities"

export const getReportById = async (id: string) => {
    const model = getModel(Collection.REPORTS, ReportSchemaMongo)

    const report = await model.findById(id);
    console.log(report)
    return report;
}