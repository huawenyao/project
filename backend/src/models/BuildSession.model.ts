/**
 * Build Session Model
 *
 * 构建会话模型 - 作为聚合根，管理一次完整的应用构建会话
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { AgentWorkStatus } from './AgentWorkStatus.model';
import { DecisionRecord } from './DecisionRecord.model';
import { AgentErrorRecord } from './AgentErrorRecord.model';
import { CollaborationEvent } from './CollaborationEvent.model';
import { PreviewData } from './PreviewData.model';
import { UserInteractionMetric } from './UserInteractionMetric.model';
import { BuildSessionData, BuildSessionCreationAttributes, BuildSessionStatus } from '../types/visualization.types';

@Table({
  tableName: 'build_session',
  timestamps: true,
  underscored: true,
})
export class BuildSession extends Model<BuildSessionData, BuildSessionCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'session_id' })
  sessionId!: string;

  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  userId!: string;

  @Column({ type: DataType.UUID, allowNull: false, field: 'project_id' })
  projectId!: string;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, allowNull: false, field: 'start_time' })
  startTime!: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'end_time' })
  endTime?: Date;

  @Column({
    type: DataType.ENUM('in_progress', 'success', 'failed', 'partial_success'),
    allowNull: false,
    defaultValue: 'in_progress',
  })
  status!: BuildSessionStatus;

  @Default([])
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, field: 'agent_list' })
  agentList!: string[];

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  archived!: boolean;

  @Column({ type: DataType.DATE, allowNull: true, field: 'archived_at' })
  archivedAt?: Date;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'storage_path' })
  storagePath?: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;

  // Associations
  @HasMany(() => AgentWorkStatus)
  agentStatuses!: AgentWorkStatus[];

  @HasMany(() => DecisionRecord)
  decisions!: DecisionRecord[];

  @HasMany(() => AgentErrorRecord)
  errors!: AgentErrorRecord[];

  @HasMany(() => CollaborationEvent)
  collaborationEvents!: CollaborationEvent[];

  @HasMany(() => PreviewData)
  previews!: PreviewData[];

  @HasMany(() => UserInteractionMetric)
  userInteractions!: UserInteractionMetric[];
}
