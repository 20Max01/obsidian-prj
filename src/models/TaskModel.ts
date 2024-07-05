import { TFile } from 'obsidian';
import Logging from 'src/classes/Logging';
import { Path } from 'src/classes/Path';
import { ILogger } from 'src/interfaces/ILogger';
import Helper from 'src/libs/Helper';
import { TagsDefaultDependencies } from 'src/libs/Tags/DefaultDependencies';
import Tags from 'src/libs/Tags/Tags';
import { Status } from 'src/types/PrjTypes';
import TaskData from './Data/TaskData';
import { PrjTaskManagementModel } from './PrjTaskManagementModel';

export class TaskModel extends PrjTaskManagementModel<TaskData> {
    protected logger: ILogger = Logging.getLogger('TaskModel');

    public static registerThisModelFactory(): void {
        // eslint-disable-next-line no-console
        console.debug('Registering `TaskModel` at `PrjTaskManagementModel`');

        PrjTaskManagementModel.registerModelFactory(
            'Task',
            (file: TFile) => new TaskModel(file),
        );
    }

    public get relatedTasks(): TaskModel[] {
        this._relatedTasks = this._relatedTasks ?? this.getRelatedTasks();

        return this._relatedTasks;
    }

    private _relatedTasks: TaskModel[] | null | undefined = undefined;

    constructor(file: TFile | undefined) {
        super(file, TaskData);
    }

    private getRelatedTasks(
        status?: (status: Status | undefined) => boolean,
    ): TaskModel[] {
        const filesWithSameTags = this.metadataCache.cache.filter((file) => {
            const fileTags = new Tags(
                file.metadata?.frontmatter?.tags,
                TagsDefaultDependencies,
            );
            const thisTags = this.data.tags;

            return (
                fileTags.some((tag) => thisTags?.includes(tag) ?? false) &&
                file.file.basename !== this.file.basename &&
                file.metadata?.frontmatter?.type === 'Task' &&
                (status ? status(file.metadata?.frontmatter?.status) : true)
            );
        });

        const relatedTasks: TaskModel[] = [];

        filesWithSameTags.forEach((file) => {
            if (file instanceof TFile) {
                relatedTasks.push(new TaskModel(file));
            }
        });

        return relatedTasks;
    }

    public override getAcronym(): string {
        return Helper.generateAcronym(this.data.title as string, 4, 't');
    }

    public override getAutomaticFilename(): string | undefined {
        if (!this.data.title && this.data.description) {
            const firstDescriptionLine = this.data.description.split('\n')[0];
            this.data.title = firstDescriptionLine.replace(/\.*$/, '');
        }
        const automaticFilename = super.getAutomaticFilename();
        const history = this.data.history?.first();

        if (!history) {
            return automaticFilename;
        }

        const date = Helper.formatDate(
            history.date,
            this.global.settings.dateFormat,
        );

        const newFileName = Path.sanitizeFilename(
            `${date} - ${automaticFilename}`,
        );

        return newFileName;
    }
}
