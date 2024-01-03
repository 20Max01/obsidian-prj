import IPrjData from "./interfaces/IPrjData";
import IPrjTaskManagement from "./interfaces/IPrjTaskManagement";
import { Status, Priority, Energy } from "./types/PrjTypes";

export default class TaskData implements IPrjData, IPrjTaskManagement {
    title: string | null | undefined;
    description: string | null | undefined;
    status: Status | null | undefined;
    priority: Priority | null | undefined;
    energy: Energy | null | undefined;
    due: Date | null | undefined;
    tags: string[] | string | null | undefined;

    constructor(data: Partial<TaskData>) {
        this.title = data.title !== undefined ? data.title : undefined;
        this.description = data.description !== undefined ? data.description : undefined;
        this.status = data.status !== undefined ? data.status : undefined;
        this.priority = data.priority !== undefined ? data.priority : undefined;
        this.energy = data.energy !== undefined ? data.energy : undefined;
        this.due = data.due !== undefined ? data.due : undefined;
        this.tags = data.tags !== undefined ? data.tags : undefined;
    }
}
