import { Model, DataTypes, Sequelize } from 'sequelize';
import { AgentWorkStatusData, AgentWorkStatusCreationAttributes } from '../types/visualization.types';

export class AgentWorkStatus extends Model<AgentWorkStatusData, AgentWorkStatusCreationAttributes> implements AgentWorkStatusData {
  public statusId!: string;
  public sessionId!: string;
  public agentId!: string;
  public agentType!: 'UIAgent' | 'BackendAgent' | 'DatabaseAgent' | 'IntegrationAgent' | 'DeploymentAgent';
  public status!: 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying' | 'skipped';
  public taskDescription!: string;
  public progressPercentage!: number;
  public startTime?: string;
  public endTime?: string;
  public retryCount!: number;
  public maxRetry!: number;
  public lastError?: string;
  public readonly createdAt!: string;
  public readonly updatedAt!: string;
}

export function initAgentWorkStatusModel(sequelize: Sequelize): typeof AgentWorkStatus {
  AgentWorkStatus.init(
    {
      statusId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'status_id'
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'session_id',
        references: {
          model: 'build_session',
          key: 'session_id'
        }
      },
      agentId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'agent_id'
      },
      agentType: {
        type: DataTypes.ENUM('UIAgent', 'BackendAgent', 'DatabaseAgent', 'IntegrationAgent', 'DeploymentAgent'),
        allowNull: false,
        field: 'agent_type'
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'retrying', 'skipped'),
        allowNull: false,
        defaultValue: 'pending'
      },
      taskDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'task_description'
      },
      progressPercentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'progress_percentage',
        validate: {
          min: 0,
          max: 100
        }
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_time'
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_time'
      },
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'retry_count'
      },
      maxRetry: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        field: 'max_retry'
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'last_error'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      tableName: 'agent_work_status',
      timestamps: true,
      underscored: true
    }
  );

  return AgentWorkStatus;
}
