import { Notice, TFile } from 'obsidian';
import API from 'src/classes/API';
import type { IApp } from 'src/interfaces/IApp';
import type { ILogger, ILogger_ } from 'src/interfaces/ILogger';
import type IMetadataCache from 'src/interfaces/IMetadataCache';
import { IPrj } from 'src/interfaces/IPrj';
import PrjNoteData from 'src/models/Data/PrjNoteData';
import type { IPrjModel_ } from 'src/models/interfaces/IPrjModel';
import { NoteModel } from 'src/models/NoteModel';
import type { IPrjSettings } from 'src/types/PrjSettings';
import { Inject, resolve } from 'ts-injex';
import type {
    IModal_,
    IModal,
    IModalFluentApi,
} from './Modal/interfaces/IModal';
import { IOpenCallback } from './Modal/types/IModalCallbacks';
import type { IHelperObsidian } from '../Helper/interfaces/IHelperObsidian';
import type { ITags, ITags_ } from '../Tags/interfaces/ITags';
import type ITranslationService from '../TranslationService/interfaces/ITranslationService';

/**
 * Modal to create a new metadata file
 */
export default class CreateNewNoteModal {
    @Inject(
        'ILogger_',
        (x: ILogger_) => x.getLogger('CreateNewNoteModal'),
        false,
    )
    protected readonly _logger?: ILogger;
    @Inject('IApp')
    protected readonly __IApp!: IApp;
    @Inject('IMetadataCache')
    private readonly __IMetadataCache!: IMetadataCache;
    @Inject('IHelperObsidian')
    private readonly __IHelperObsidian!: IHelperObsidian;
    @Inject('ITranslationService')
    private readonly __ITranslationService!: ITranslationService;
    @Inject('IPrjSettings')
    private readonly __PrjSettings!: IPrjSettings;
    @Inject('ITags_')
    private readonly __ITags: ITags_;
    @Inject('Obsidian.Notice_')
    private readonly __Notice: Notice & {
        new (message: string | DocumentFragment, duration?: number): Notice;
    };
    @Inject('NoteModel_')
    private readonly __INoteModel!: IPrjModel_<NoteModel>;

    @Inject('IModal_', (modal: IModal_) => new modal())
    private readonly _modal!: IModal;

    private readonly _result: Partial<Record<keyof PrjNoteData, unknown>> = {};

    /**
     * Creates an instance of CreateNewMetadataModal.
     */
    constructor() {
        this._modal
            .setBackgroundDimmed(false)
            .setDraggableEnabled(true)
            .setTitle(this.__ITranslationService.get('Create new metadata'))
            .setOnOpen(this.onOpen)
            .open();
    }

    /**
     * Creates the modal content
     * @param modal The modal to add the content to.
     */
    private readonly onOpen: IOpenCallback = (
        modal: IModal & IModalFluentApi,
    ) => {
        modal
            .then((modal) => modal.content.addClass('custom-form'))

            .addSettingRow((titleRow) => {
                titleRow
                    .setName(this.__ITranslationService.get('Title'))
                    .setDescription(
                        this.__ITranslationService.get('Title description'),
                    )
                    .add('input', (title) => {
                        title
                            .setResultKey('title')
                            .setRequired(true)
                            .setSpellcheck(true)
                            .setPlaceholder(
                                this.__ITranslationService.get('Title'),
                            );
                    });
            })

            .addSettingRow((dateRow) => {
                dateRow
                    .setName(this.__ITranslationService.get('Date'))
                    .setDescription(
                        this.__ITranslationService.get('DocDateDescription'),
                    )
                    .add('input', (date) => {
                        date.setResultKey('date')
                            .setPlaceholder('YYYY.MM.DD')
                            .setType('date');
                    });
            })

            .addSettingRow((descriptionRow) => {
                descriptionRow
                    .setName(
                        this.__ITranslationService.get('Document description'),
                    )
                    .setDescription(
                        this.__ITranslationService.get(
                            'Document description description',
                        ),
                    )
                    .setClass('custom-form-textarea')
                    .add('input', (description) => {
                        description
                            .setResultKey('description')
                            .setSpellcheck(true)
                            .setType('textarea')
                            .setPlaceholder(
                                this.__ITranslationService.get(
                                    'Document description',
                                ),
                            );
                    });
            })

            .addSettingRow((tagSearchRow) => {
                this._modal.result.tags = new this.__ITags(undefined);

                const tags = this.__IMetadataCache.cache
                    .map((tag) => tag?.metadata?.frontmatter?.tags)
                    .filter((tag) => tag !== undefined) as string[][];

                const tagsFlat = tags.flat();
                const tagsSet = new Set(tagsFlat);

                tagSearchRow
                    .setName(this.__ITranslationService.get('Tags'))
                    .setDescription(
                        this.__ITranslationService.get('Tags description'),
                    )
                    .add('tagsearch', (tagSearch) => {
                        tagSearch
                            .setDefaultEntries(() => {
                                const activeFile =
                                    this.__IHelperObsidian.getActiveFile();

                                const activeFileTags = new this.__ITags(
                                    undefined,
                                );
                                activeFileTags.loadTagsFromFile(activeFile);

                                return activeFileTags.value || [];
                            })
                            .setList(this._modal.result.tags as ITags)
                            .setPlaceholder(
                                this.__ITranslationService.get('Tags'),
                            )
                            .addSuggestion(() => {
                                return Array.from(tagsSet);
                            });
                    });
            })

            .addSettingRow((buttonsRow) => {
                buttonsRow
                    .add('button', (save) => {
                        save.setButtonText(
                            this.__ITranslationService.get('Save'),
                        )
                            .setCta(true)
                            .onClick(() => {
                                if (this._modal.isRequiredFullfilled) {
                                    this.save();
                                    this._modal.close();
                                } else {
                                    new this.__Notice(
                                        this.__ITranslationService.get(
                                            'Please fill in all required fields',
                                        ),
                                        2500,
                                    );
                                }
                            });
                    })
                    .add('button', (close) => {
                        close
                            .setButtonText(
                                this.__ITranslationService.get('Cancel'),
                            )
                            .setCta(true)
                            .onClick(() => {
                                this._modal.close();
                            });
                    });
            });
    };

    /**
     * Saves the result of the modal
     * to a new metadata file
     */
    private async save(): Promise<void> {
        const result = this._modal.result;

        const note = new this.__INoteModel(undefined);

        const folder = this.__PrjSettings.noteSettings.defaultFolder;

        note.data = result as Partial<PrjNoteData>;

        // No existing file, create a new one
        let template = '';

        // If a template is set, use it
        const templateFile = this.__IApp.vault.getAbstractFileByPath(
            this.__PrjSettings.noteSettings.template,
        );

        if (templateFile && templateFile instanceof TFile) {
            try {
                template = await this.__IApp.vault.read(templateFile);
            } catch (error) {
                this._logger?.error(
                    `Error reading template file '${templateFile.path}'`,
                    error,
                );
            }
        }

        const newFileName = API.noteModel.generateFilename(note);

        await note.createFile(folder, newFileName, template);

        if (note) await this.__IHelperObsidian.openFile(note.file);
    }

    /**
     * Registers the command to open the modal
     */
    public static registerCommand(): void {
        const plugin = resolve<IPrj>('IPrj');

        const iTranslationService = resolve<ITranslationService>(
            'ITranslationService',
        );

        const logger =
            resolve<ILogger_>('ILogger_').getLogger('CreateNewNoteModal');

        try {
            plugin.addCommand({
                id: 'create-new-note-file',
                name: `${iTranslationService.get('Create new note')}`,
                /**
                 * Callback function for the command
                 */
                callback: async () => {
                    new this();
                },
            });

            logger?.trace(
                "Registered 'Create new note Modal' command successfully",
            );
        } catch (error) {
            logger?.error(
                "Failed to register 'Create new note Modal' command",
                error,
            );
        }
    }
}
