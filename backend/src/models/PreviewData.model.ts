/**
 * Preview Data Model
 *
 * 预览数据模型 - 存储 Agent 生成的可预览内容（UI 组件、代码片段等）
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { BuildSession } from './BuildSession.model';
import { DecisionRecord } from './DecisionRecord.model';
import { PreviewDataRecord, PreviewDataCreationAttributes, AgentType } from '../types/visualization.types';

@Table({
  tableName: 'preview_data',
  timestamps: true,
  underscored: true,
})
export class PreviewData extends Model<PreviewDataRecord, PreviewDataCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'preview_id' })
  previewId!: string;

  @ForeignKey(() => BuildSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'session_id' })
  sessionId!: string;

  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    allowNull: false,
    field: 'agent_type',
  })
  agentType!: AgentType;

  @ForeignKey(() => DecisionRecord)
  @Column({ type: DataType.UUID, allowNull: true, field: 'decision_id' })
  decisionId?: string;

  @Column({ type: DataType.JSONB, allowNull: false, field: 'preview_content' })
  previewContent!: any;

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp!: Date;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;

  @BelongsTo(() => BuildSession)
  buildSession!: BuildSession;

  @BelongsTo(() => DecisionRecord)
  decisionRecord?: DecisionRecord;
}
