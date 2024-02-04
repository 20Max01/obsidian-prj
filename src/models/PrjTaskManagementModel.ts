import { TFile, moment } from 'obsidian';
import { FileModel } from './FileModel';
import IPrjModel from '../interfaces/IPrjModel';
import IPrjData from '../interfaces/IPrjData';
import IPrjTaskManagement from '../interfaces/IPrjTaskManagement';
import PrjTypes, { Status } from 'src/types/PrjTypes';
import API from 'src/classes/API';
import TaskData from 'src/types/TaskData';
import ProjectData from 'src/types/ProjectData';
import TopicData from 'src/types/TopicData';
import { ILogger } from 'src/interfaces/ILogger';
import Logging from 'src/classes/Logging';
import Tags from 'src/libs/Tags';
import Helper from 'src/libs/Helper';

export class PrjTaskManagementModel<T extends IPrjData & IPrjTaskManagement>
    extends FileModel<T>
    implements IPrjModel<T>
{
    protected logger: ILogger = Logging.getLogger('PrjTaskManagementModel');

    get tags(): string[] {
        const tags = this.data.tags;
        let formattedTags: string[] = [];

        if (tags && typeof tags === 'string') {
            formattedTags = [tags];
        } else if (Array.isArray(tags)) {
            formattedTags = [...tags];
        }

        return formattedTags;
    }
    set tags(value: string[]) {
        this.data.tags = value;
    }

    public get data(): Partial<T> {
        return this._data;
    }
    public set data(value: Partial<T>) {
        this._data = value;
    }

    constructor(file: TFile | undefined, ctor: new (data?: Partial<T>) => T) {
        super(file, ctor, undefined);
    }

    public override toString(): string {
        let allText = this.data.title ?? '';
        allText += this.data.description ?? '';
        allText += this.data.status ?? '';
        allText += this.data.due ?? '';
        allText += this.data.tags ?? '';

        return allText;
    }

    /**
     * Returns the corosponding symbol for the model from the settings.
     * @returns The corosponding symbol for the model. (Lucide icon string)
     */
    public getCorospondingSymbol(): string {
        switch (this.data.type) {
            case 'Topic':
                return this.global.settings.prjSettings.topicSymbol;
            case 'Project':
                return this.global.settings.prjSettings.projectSymbol;
            case 'Task':
                return this.global.settings.prjSettings.taskSymbol;
            default:
                return 'x-circle';
        }
    }

    /**
     * Returns the acronym of the title of the model.
     * @returns The acronym of the title.
     * @remarks - If the title is not available, an empty string is returned.
     * - Override if the acronym should be generated differently!
     */
    public getAcronym(): string {
        return Helper.generateAcronym(this.data.title as string);
    }

    /**
     * Check if the `newStatus` is valid and change the status of the model.
     * @param newStatus The new status to set.
     * @remarks - A history entry will be added if the status changes.
     * - This function will start and finish a transaction if no transaction is currently running.
     */
    public changeStatus(newStatus: unknown): void {
        const status = PrjTypes.isValidStatus(newStatus);

        if (!status) return;

        if (this.data.status !== status) {
            let internalTransaction = false;

            if (!this.isTransactionActive) {
                this.startTransaction();
                internalTransaction = true;
            }
            this.data.status = status;
            this.addHistoryEntry(status);

            if (internalTransaction) this.finishTransaction();
        }
    }

    /**
     * Returns the urgency of the model.
     */
    public get urgency(): number {
        return API.prjTaskManagementModel.calculateUrgency(
            this as PrjTaskManagementModel<TaskData | TopicData | ProjectData>,
        );
    }

    /**
     * Add a new history entry to the model.
     * @param status The status to add to the history. If not provided, the current status of the model will be used.
     * @remarks - This function will not start or finish a transaction.
     * - If no status is provided and the model has no status, an error will be logged and the function will return.
     */
    private addHistoryEntry(status?: Status | undefined): void {
        if (!status) {
            if (this.data.status) status = this.data.status;
            else {
                this.logger.error('No status aviable to add to history');

                return;
            }
        }

        if (!this.data.history) this.data.history = [];

        this.data.history.push({
            status: status,
            date: moment().format('YYYY-MM-DDTHH:mm'),
        });
    }

    /**
     * Returns the tags of the model as an array of strings
     * @returns Array of strings containing the tags
     */
    public getTags(): string[] {
        const tags = this.data.tags;
        let formattedTags: string[] = [];

        if (tags && typeof tags === 'string') {
            formattedTags = [tags];
        } else if (Array.isArray(tags)) {
            formattedTags = [...tags];
        }

        return formattedTags;
    }

    /**
     * Returns the aliases of the model as an array of strings
     * @returns Array of strings containing the aliases
     */
    public getAliases(): string[] {
        const aliases = this.data.aliases;
        let formattedAliases: string[] = [];

        if (aliases && typeof aliases === 'string') {
            formattedAliases = [aliases];
        } else if (Array.isArray(aliases)) {
            formattedAliases = [...aliases];
        }

        return formattedAliases;
    }

    /**
     * Retrieves the automatic filename based on the title and aliases.
     *
     * @returns The automatic filename or undefined if the title or aliases are not available.
     * @remarks If the file's parent path is available, a new filename is generated by combining the last alias, title, and file extension.
     * @logging If the title or aliases are not available, a warning message is logged and undefined is returned.
     */
    public getAutomaticFilename(): string | undefined {
        const title = this.data.title;

        const aliases =
            this.getAliases().length > 0
                ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  Tags.getTagElements(this.getAliases().first()!)
                : undefined;

        let filename: string;

        if (!title) {
            this.logger.warn(`No title found for file ${this.file?.path}`);

            return;
        }

        if (!aliases) {
            this.logger.info(`No aliases found for file ${this.file?.path}`);
            filename = title;
        } else {
            filename = `${aliases.last()} - ${title}`;
        }

        if (this.file.parent?.path) {
            const newFileName = Helper.sanitizeFilename(filename);

            this.logger.debug(
                `New filename for ${this.file.path}: ${newFileName}`,
            );

            return newFileName;
        }
    }
}
