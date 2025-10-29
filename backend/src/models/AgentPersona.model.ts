/**
 * Agent Persona Model
 *
 * Agent 拟人化配置模型 - 定义 Agent 的显示特征和个性
 */

import { Table, Column, Model, PrimaryKey, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { AgentPersonaData, AgentPersonaCreationAttributes, AgentType, PersonalityTone, Priority } from '../types/visualization.types';

@Table({
  tableName: 'agent_persona',
  timestamps: true,
  underscored: true,
})
export class AgentPersona extends Model<AgentPersonaData, AgentPersonaCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
    field: 'agent_type',
  })
  agentType!: AgentType;

  @Column({ type: DataType.STRING(100), allowNull: false, field: 'display_name' })
  displayName!: string;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'avatar_url' })
  avatarUrl?: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'personality_tone',
  })
  personalityTone!: PersonalityTone;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  specialties!: string[];

  @Column({
    type: DataType.ENUM('high', 'medium', 'low'),
    allowNull: false,
  })
  priority!: Priority;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'update_frequency' })
  updateFrequency!: number;

  @CreatedAt
  @Column({ field: 'created_at' })
  override createdAt!: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  override updatedAt!: Date;
}
