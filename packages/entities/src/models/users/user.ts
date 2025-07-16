import { Base } from "../../common";

export interface User extends Base {
    name: string;
    email: string;
    password: string;
}