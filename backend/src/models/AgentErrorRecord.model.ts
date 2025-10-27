/**
 * Agent Error Record Model
 *
 * Agent 错误记录模型 - 记录 Agent 执行过程中的错误和异常
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { BuildSession } from './BuildSession.model';
import { ErrorRecordData, ErrorRecordCreationAttributes, ErrorSeverity, ErrorResolution, AgentType } from '../types/visualization.types';

@Table({
  tableName: 'agent_error_record',
  timestamps: true,
  underscored: true,
})
export class AgentErrorRecord extends Model<ErrorRecordData, ErrorRecordCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'error_id' })
  errorId!: string;

  @ForeignKey(() => BuildSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'session_id' })
  sessionId!: string;

  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    allowNull: false,
    field: 'agent_type',
  })
  agentType!: AgentType;

  @Column({ type: DataType.STRING(50), allowNull: false, field: 'error_code' })
  errorCode!: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'error_message' })
  errorMessage!: string;

  @Column({ type: DataType.JSONB, allowNull: false, field: 'error_context' })
  errorContext!: any;

  @Column({
    type: DataType.ENUM('critical', 'high', 'medium', 'low'),
    allowNull: false,
  })
  severity!: ErrorSeverity;

  @Column({
    type: DataType.ENUM('resolved', 'retrying', 'user_intervention_required', 'skipped', 'unresolved'),
    allowNull: false,
  })
  resolution!: ErrorResolution;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'resolution_notes' })
  resolutionNotes?: string;

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
}
