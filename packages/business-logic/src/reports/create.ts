import { Collection, getModel } from "@repo/constant-definitions"
import { ReportSchemaMongo } from "@repo/entities"

export const createReport = async (templateId: string, content: string, date: string, duration: string, summary: string) => {
    const model = getModel(Collection.REPORTS, ReportSchemaMongo)
    const report = await model.create({
        userId: "admin",
        templateId,
        content,
        date,
        duration,
        summary,
    });
    await report.save();

    return report;
}