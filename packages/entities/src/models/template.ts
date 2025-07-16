import { Base } from "../common";

export interface Template extends Base {
    name: string;
    type: string;
    fields: string[];
    userId: string;
}