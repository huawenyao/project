/**
 * Version Service
 * 前端API客户端 - 版本管理
 */

export interface VersionApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class VersionService {
  private baseUrl = '/api/projects';

  /**
   * 获取项目的版本列表
   */
  async getVersions(projectId: string): Promise<VersionApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${projectId}/versions`);
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建版本快照
   */
  async createSnapshot(
    projectId: string,
    description?: string
  ): Promise<VersionApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 恢复到指定版本
   */
  async restoreVersion(
    projectId: string,
    versionId: string
  ): Promise<VersionApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${projectId}/versions/${versionId}/restore`,
        {
          method: 'POST',
        }
      );
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 对比两个版本
   */
  async compareVersions(
    projectId: string,
    versionId1: string,
    versionId2: string
  ): Promise<VersionApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${projectId}/versions/compare?versionId1=${versionId1}&versionId2=${versionId2}`
      );
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new VersionService();
