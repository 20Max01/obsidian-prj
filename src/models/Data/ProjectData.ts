import { fieldConfig } from 'src/classes/decorators/FieldConfigDecorator';
import { toStringField } from 'src/classes/decorators/ToStringFieldDecorator';
import IPrjData from 'src/interfaces/IPrjData';
import IPrjTaskManagement from 'src/interfaces/IPrjTaskManagement';
import {
    FileSubType,
    Status,
    Priority,
    Energy,
    HistoryEntries,
} from 'src/types/PrjTypes';
import BaseData from './BaseData';

export default class ProjectData
    extends BaseData<ProjectData>
    implements IPrjData, IPrjTaskManagement
{
    @fieldConfig('Project')
    type: 'Project' | null | undefined;

    @fieldConfig()
    subType: FileSubType | null | undefined;

    @toStringField
    @fieldConfig()
    title: string | null | undefined;

    @toStringField
    @fieldConfig()
    description: string | null | undefined;

    @toStringField
    @fieldConfig()
    status: Status | null | undefined;

    @fieldConfig()
    priority: Priority | null | undefined;

    @fieldConfig()
    energy: Energy | null | undefined;

    @toStringField
    @fieldConfig()
    due: string | null | undefined;

    @toStringField
    @fieldConfig()
    tags: string[] | string | null | undefined;

    @fieldConfig()
    history: HistoryEntries | null | undefined;

    @fieldConfig()
    aliases: string[] | null | undefined;

    constructor(data: Partial<ProjectData>) {
        super(data);
    }
}
