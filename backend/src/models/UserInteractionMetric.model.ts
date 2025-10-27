/**
 * User Interaction Metric Model
 *
 * 用户交互指标模型 - 记录用户在可视化界面上的交互行为（用于分析和优化）
 */

import { Table, Column, Model, PrimaryKey, Default, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { BuildSession } from './BuildSession.model';
import { UserInteractionMetricData, UserInteractionMetricCreationAttributes, EventType } from '../types/visualization.types';

@Table({
  tableName: 'user_interaction_metric_event',
  timestamps: true,
  underscored: true,
})
export class UserInteractionMetric extends Model<UserInteractionMetricData, UserInteractionMetricCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'event_id' })
  eventId!: string;

  @ForeignKey(() => BuildSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'session_id' })
  sessionId!: string;

  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  userId!: string;

  @Column({
    type: DataType.ENUM('click', 'hover', 'expand', 'collapse', 'filter', 'search', 'export', 'navigate'),
    allowNull: false,
    field: 'event_type',
  })
  eventType!: EventType;

  @Column({ type: DataType.JSONB, allowNull: false, field: 'event_metadata' })
  eventMetadata!: any;

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp!: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  anonymized!: boolean;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date;

  @BelongsTo(() => BuildSession)
  buildSession!: BuildSession;
}
