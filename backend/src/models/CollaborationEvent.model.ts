/**
 * Collaboration Event Model
 *
 * Agent 协作事件模型 - 记录 Agent 之间的协作和通信
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { BuildSession } from './BuildSession.model';
import { CollaborationEventData, CollaborationEventCreationAttributes, CollaborationType, AgentType } from '../types/visualization.types';

@Table({
  tableName: 'collaboration_event',
  timestamps: true,
  underscored: true,
})
export class CollaborationEvent extends Model<CollaborationEventData, CollaborationEventCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'event_id' })
  eventId!: string;

  @ForeignKey(() => BuildSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'session_id' })
  sessionId!: string;

  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    allowNull: false,
    field: 'source_agent',
  })
  sourceAgent!: AgentType;

  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    allowNull: false,
    field: 'target_agent',
  })
  targetAgent!: AgentType;

  @Column({
    type: DataType.ENUM('request', 'response', 'notification', 'data_transfer', 'handoff'),
    allowNull: false,
    field: 'collaboration_type',
  })
  collaborationType!: CollaborationType;

  @Column({ type: DataType.JSONB, allowNull: false })
  payload!: any;

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp!: Date;

  @CreatedAt
  @Column({ field: 'created_at' })
  override createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  override updatedAt!: Date;

  @BelongsTo(() => BuildSession)
  buildSession!: BuildSession;
}
