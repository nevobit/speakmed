import { Collection, getModel } from "@repo/constant-definitions"
import { Report, ReportSchemaMongo } from "@repo/entities"

export const getReportById = async (id: string) => {
    const model = getModel<Report>(Collection.REPORTS, ReportSchemaMongo)

    const report = await model.findById(id);
    console.log(report)
    return report;
}