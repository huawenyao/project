/**
 * Decision Record Model
 *
 * Agent 决策记录模型 - 记录 Agent 的所有重要决策及推理过程
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { BuildSession } from './BuildSession.model';
import { DecisionRecordData, DecisionRecordCreationAttributes, DecisionType, DecisionImpact, AgentType } from '../types/visualization.types';

@Table({
  tableName: 'decision_record',
  timestamps: true,
  underscored: true,
})
export class DecisionRecord extends Model<DecisionRecordData, DecisionRecordCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'decision_id' })
  decisionId!: string;

  @ForeignKey(() => BuildSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'session_id' })
  sessionId!: string;

  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    allowNull: false,
    field: 'agent_type',
  })
  agentType!: AgentType;

  @Column({
    type: DataType.ENUM('tech_selection', 'ui_design', 'architecture', 'data_model', 'api_design', 'deployment_config', 'other'),
    allowNull: false,
    field: 'decision_type',
  })
  decisionType!: DecisionType;

  @Column({ type: DataType.STRING(200), allowNull: false, field: 'decision_title' })
  decisionTitle!: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'decision_content' })
  decisionContent?: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  reasoning!: any;

  @Column({ type: DataType.JSONB, allowNull: true })
  alternatives?: any;

  @Column({ type: DataType.TEXT, allowNull: true })
  tradeoffs?: string;

  @Column({
    type: DataType.ENUM('high', 'medium', 'low'),
    allowNull: false,
  })
  impact!: DecisionImpact;

  @Column({
    type: DataType.ENUM('critical', 'high', 'medium', 'low'),
    allowNull: true,
  })
  importance?: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  tags?: string[];

  @Column({ type: DataType.JSONB, allowNull: true })
  metadata?: any;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, field: 'affected_components' })
  affectedComponents!: string[];

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp!: Date;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'is_read' })
  isRead!: boolean;

  @CreatedAt
  @Column({ field: 'created_at' })
  override createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  override updatedAt!: Date;

  @BelongsTo(() => BuildSession)
  buildSession!: BuildSession;
}
