import { Model, DataTypes, Sequelize } from 'sequelize';
import { BuildSessionData, BuildSessionCreationAttributes } from '../types/visualization.types';

export class BuildSession extends Model<BuildSessionData, BuildSessionCreationAttributes> implements BuildSessionData {
  public sessionId!: string;
  public userId!: string;
  public projectId!: string;
  public startTime!: string;
  public endTime?: string;
  public status!: 'in_progress' | 'success' | 'failed' | 'partial_success';
  public agentList!: string[];
  public archived!: boolean;
  public archivedAt?: string;
  public storagePath?: string;
  public readonly createdAt!: string;
  public readonly updatedAt!: string;
}

export function initBuildSessionModel(sequelize: Sequelize): typeof BuildSession {
  BuildSession.init(
    {
      sessionId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'session_id'
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id'
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'project_id'
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'start_time'
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_time'
      },
      status: {
        type: DataTypes.ENUM('in_progress', 'success', 'failed', 'partial_success'),
        allowNull: false,
        defaultValue: 'in_progress'
      },
      agentList: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
        field: 'agent_list'
      },
      archived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'archived_at'
      },
      storagePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'storage_path'
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
      tableName: 'build_session',
      timestamps: true,
      underscored: true
    }
  );

  return BuildSession;
}
