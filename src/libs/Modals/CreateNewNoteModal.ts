import Global from 'src/classes/Global';
import Lng from 'src/classes/Lng';
import DocumentData from 'src/types/DocumentData';
import {
    Field,
    FormConfiguration,
    IFormResult,
    IResultData,
} from 'src/types/ModalFormType';
import BaseModalForm from './BaseModalForm';
import Helper from '../Helper';
import { TFile } from 'obsidian';
import { NoteModel } from 'src/models/NoteModel';
import NoteData from 'src/types/NoteData';
import { StaticNoteModel } from 'src/models/StaticHelper/StaticNoteModel';
import { Path } from 'src/classes/Path';
import Logging from 'src/classes/Logging';

/**
 * Modal to create a new metadata file
 */
export default class CreateNewNoteModal extends BaseModalForm {
    /**
     * Creates an instance of CreateNewMetadataModal.
     */
    constructor() {
        super();
    }

    /**
     * Registers the command to open the modal
     * @remarks No cleanup needed
     */
    public static registerCommand(): void {
        const global = Global.getInstance();
        const logger = Logging.getLogger('CreateNewNoteModal');
        logger.trace("Registering 'CreateNewNoteModal' commands");

        global.plugin.addCommand({
            id: 'create-new-note-file',
            name: `${Lng.gt('Create new note')}`,
            callback: async () => {
                const modal = new CreateNewNoteModal();
                const result = await modal.openForm();

                if (result) {
                    const document = await modal.evaluateForm(result);

                    if (document) await Helper.openFile(document.file);
                }
            },
        });
    }

    /**
     * Opens the modal form
     * @param {Partial<NoteData>} [preset] Preset values for the form
     * @returns {Promise<IFormResult | undefined>} Result of the form
     */
    public async openForm(
        preset?: Partial<NoteData>,
    ): Promise<IFormResult | undefined> {
        if (!this.isApiAvailable()) return;
        this.logger.trace("Opening 'CreateNewNoteModal' form");
        const convertedPreset: IResultData = {};

        if (preset) {
            for (const [key, value] of Object.entries(preset)) {
                convertedPreset[key] = value ?? '';
            }
        }
        const activeFile = Helper.getActiveFile();
        const tags: string[] = BaseModalForm.getTags(activeFile);

        if (convertedPreset) {
            if (convertedPreset.tags && Array.isArray(convertedPreset.tags)) {
                convertedPreset.tags = [...convertedPreset.tags, ...tags];
            } else {
                convertedPreset.tags = [...tags];
            }
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];

        convertedPreset.date = formattedDate;

        const form = this.constructForm();

        const result = await this.getApi().openForm(form, {
            values: convertedPreset,
        });

        this.logger.trace(
            `From closes with status '${result.status}' and data:`,
            result.data,
        );

        return result;
    }

    /**
     * Evaluates the form result and creates or renames a note accordingly.
     *
     * @param result - The form result containing the data.
     * @param existingFile - The existing file to be renamed, if applicable.
     * @returns A Promise that resolves to the created or renamed NoteModel, or undefined if the API is not available or the form result is invalid.
     */
    public async evaluateForm(
        result: IFormResult,
        existingFile?: TFile,
    ): Promise<NoteModel | undefined> {
        if (!this.isApiAvailable()) return;

        if (result.status !== 'ok' || !result.data) return;

        const note = new NoteModel(existingFile ? existingFile : undefined);

        const folder = existingFile?.parent?.path
            ? existingFile.parent?.path
            : this.settings.noteSettings.defaultFolder;

        note.data = result.data as Partial<DocumentData>;

        if (!existingFile) {
            // No existing file, create a new one
            let template = '';

            // If a template is set, use it
            const templateFile = this.app.vault.getAbstractFileByPath(
                this.settings.noteSettings.template,
            );

            if (templateFile && templateFile instanceof TFile) {
                try {
                    template = await this.app.vault.read(templateFile);
                } catch (error) {
                    this.logger.error(
                        `Error reading template file '${templateFile.path}'`,
                        error,
                    );
                }
            }

            const newFileName = StaticNoteModel.generateFilename(note);

            const file = await this.app.vault.create(
                Path.join(folder, `${newFileName}.md`),
                template,
            );
            note.file = file;
        } else {
            // Existing file, rename it properly
            const newFileName = StaticNoteModel.generateFilename(note);
            const newFilePath = Path.join(folder, `${newFileName}.md`);
            await this.app.fileManager.renameFile(note.file, newFilePath);
        }

        return note;
    }

    /**
     * Constructs the form
     * @returns {FormConfiguration} Form configuration
     */
    protected constructForm(): FormConfiguration {
        const form: FormConfiguration = {
            title: `${Lng.gt('Create new note')}`,
            name: 'new metadata file',
            customClassname: '',
            fields: [],
        };

        // Title
        const title: Field = {
            name: 'title',
            label: Lng.gt('Title'),
            description: Lng.gt('Title description'),
            isRequired: true,
            input: {
                type: 'text',
            },
        };
        form.fields.push(title);

        // Date
        const date: Field = {
            name: 'date',
            label: Lng.gt('Date'),
            description: Lng.gt('DocDateDescription'),
            isRequired: false,
            input: {
                type: 'date',
            },
        };
        form.fields.push(date);

        // Description
        const description: Field = {
            name: 'description',
            label: Lng.gt('Document description'),
            description: Lng.gt('Document description description'),
            isRequired: false,
            input: {
                type: 'textarea',
            },
        };
        form.fields.push(description);

        // Tags
        const tags: Field = {
            name: 'tags',
            label: Lng.gt('Tags'),
            description: Lng.gt('Tags description'),
            isRequired: false,
            input: {
                type: 'tag',
            },
        };
        form.fields.push(tags);

        return form;
    }
}
