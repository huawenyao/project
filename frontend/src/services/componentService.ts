/**
 * Component Service
 * 前端API客户端 - 组件管理
 */

import type { CanvasComponent } from '../stores/builderStore';

export interface ComponentApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ComponentService {
  private baseUrl = '/api/projects';

  /**
   * 获取项目的所有组件
   */
  async getComponents(projectId: string): Promise<ComponentApiResponse<{ components: any[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${projectId}/components`);
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建单个组件
   */
  async createComponent(
    projectId: string,
    component: Partial<CanvasComponent>
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${projectId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(component),
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
   * 批量更新组件
   */
  async updateComponents(
    projectId: string,
    components: Partial<CanvasComponent>[],
    createSnapshot = true
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${projectId}/components`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, createSnapshot }),
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
   * 更新单个组件
   */
  async updateComponent(
    projectId: string,
    componentId: string,
    updates: Partial<CanvasComponent>
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${projectId}/components/${componentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
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
   * 删除组件
   */
  async deleteComponent(
    projectId: string,
    componentId: string
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${projectId}/components/${componentId}`,
        {
          method: 'DELETE',
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
   * AI生成组件（从自然语言描述）
   */
  async generateComponents(
    projectId: string,
    description: string,
    autoSave = false
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${projectId}/components/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, autoSave }),
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
   * 解析自然语言修改命令
   */
  async parseModificationCommand(
    projectId: string,
    command: string,
    currentComponents: any[]
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(`/api/builder/parse-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, command, currentComponents }),
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
   * 生成AI设计建议
   */
  async getDesignSuggestions(
    projectId: string,
    components: any[]
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(`/api/builder/design-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, components }),
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
   * 获取智能警告
   */
  async getSmartWarnings(
    projectId: string,
    components: any[]
  ): Promise<ComponentApiResponse> {
    try {
      const response = await fetch(`/api/builder/smart-warnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, components }),
      });
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new ComponentService();
