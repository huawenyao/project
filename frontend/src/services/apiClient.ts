/**
 * 统一的API客户端配置
 * 处理所有HTTP请求、认证、错误处理等
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_TIMEOUT = 30000; // 30秒超时

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 创建axios实例
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器：添加认证token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：统一错误处理
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // 处理401未授权错误
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }

      // 处理网络错误
      if (!error.response) {
        throw new ApiError('网络错误，请检查连接');
      }

      // 提取错误消息
      const errorMessage =
        (error.response?.data as any)?.message ||
        (error.response?.data as any)?.error ||
        error.message ||
        '请求失败';

      throw new ApiError(
        errorMessage,
        error.response?.status,
        error.response?.data
      );
    }
  );

  return instance;
};

/**
 * API客户端类
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = createAxiosInstance();
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new ApiError(response.data.error || response.data.message || '请求失败');
  }

  /**
   * POST请求
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new ApiError(response.data.error || response.data.message || '请求失败');
  }

  /**
   * PUT请求
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new ApiError(response.data.error || response.data.message || '请求失败');
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new ApiError(response.data.error || response.data.message || '请求失败');
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new ApiError(response.data.error || response.data.message || '请求失败');
  }

  /**
   * 获取axios实例（用于特殊需求）
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 导出单例
export const apiClient = new ApiClient();
export default apiClient;
