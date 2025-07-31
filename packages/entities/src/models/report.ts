import { Base } from "../common";

export interface Report extends Base {
    userId: string;
    templateId: string;
    content: string;
    date: Date;
    duration: string;
    summary: string;
}