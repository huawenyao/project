/**
 * Agent Work Status Model
 *
 * Agent 工作状态模型 - 跟踪每个 Agent 的任务执行状态和进度
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { BuildSession } from './BuildSession.model';
import { AgentWorkStatusData, AgentWorkStatusCreationAttributes, AgentType, AgentStatus } from '../types/visualization.types';

@Table({
  tableName: 'agent_work_status',
  timestamps: true,
  underscored: true,
})
export class AgentWorkStatus extends Model<AgentWorkStatusData, AgentWorkStatusCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'status_id' })
  statusId!: string;

  @ForeignKey(() => BuildSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'session_id' })
  sessionId!: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'agent_id' })
  agentId!: string;

  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    allowNull: false,
    field: 'agent_type',
  })
  agentType!: AgentType;

  @Column({
    type: DataType.ENUM('pending', 'in_progress', 'completed', 'failed', 'retrying', 'skipped'),
    allowNull: false,
    defaultValue: 'pending',
  })
  status!: AgentStatus;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'task_description' })
  taskDescription!: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'progress_percentage',
    validate: { min: 0, max: 100 },
  })
  progressPercentage!: number;

  @Column({ type: DataType.DATE, allowNull: true, field: 'start_time' })
  startTime?: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'end_time' })
  endTime?: Date;

  @Default(0)
  @Column({ type: DataType.SMALLINT, allowNull: false, field: 'retry_count' })
  retryCount!: number;

  @Default(3)
  @Column({ type: DataType.SMALLINT, allowNull: false, field: 'max_retry' })
  maxRetry!: number;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'last_error' })
  lastError?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'current_operation' })
  currentOperation?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'estimated_time_remaining' })
  estimatedTimeRemaining?: number;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'error_message' })
  errorMessage?: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'result_summary' })
  resultSummary?: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  override createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  override updatedAt!: Date;

  @BelongsTo(() => BuildSession)
  buildSession!: BuildSession;
}
