/**
 * Data Archive Service
 *
 * S3 数据归档服务 - 管理热数据（30天）到冷数据（S3）的迁移
 */

import { S3 } from 'aws-sdk';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { BuildSession } from '../models';
import visualizationService from './VisualizationService';
import logger from '../utils/logger';
import { ServiceResponse } from '../types/visualization.types';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export class DataArchiveService {
  private s3: S3 | null = null;
  private bucketName: string;
  private enabled: boolean;

  constructor() {
    this.bucketName = process.env.S3_ARCHIVE_BUCKET || 'ai-builder-archives';
    this.enabled = process.env.ENABLE_S3_ARCHIVE === 'true';

    if (this.enabled) {
      this.initializeS3();
    } else {
      logger.warn('S3 archiving is disabled. Set ENABLE_S3_ARCHIVE=true to enable.');
    }
  }

  /**
   * 初始化 S3 客户端
   */
  private initializeS3(): void {
    try {
      this.s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });

      logger.info('S3 client initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize S3 client:', error);
      this.enabled = false;
    }
  }

  /**
   * 归档会话到 S3
   */
  async archiveSession(sessionId: string): Promise<ServiceResponse<string>> {
    try {
      if (!this.enabled || !this.s3) {
        return {
          success: false,
          error: 'S3 archiving is not enabled',
          timestamp: new Date().toISOString(),
        };
      }

      // 获取完整的会话数据
      const sessionResult = await visualizationService.getSessionDetails(sessionId);

      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          error: 'Session not found or could not be retrieved',
          timestamp: new Date().toISOString(),
        };
      }

      const sessionData = sessionResult.data;

      // 准备归档数据
      const archiveData = {
        session: sessionData,
        archivedAt: new Date().toISOString(),
        version: '1.0',
      };

      // 序列化并压缩数据
      const jsonData = JSON.stringify(archiveData);
      const compressedData = await gzip(Buffer.from(jsonData, 'utf-8'));

      // 生成 S3 key
      const userId = sessionData.userId;
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const s3Key = `sessions/${userId}/${timestamp}/${sessionId}.json.gz`;

      // 上传到 S3
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: compressedData,
        ContentType: 'application/gzip',
        ContentEncoding: 'gzip',
        Metadata: {
          sessionId,
          userId,
          archivedAt: new Date().toISOString(),
        },
        // 设置生命周期：在 S3 Standard 存储 1 年后转到 Glacier
        StorageClass: 'STANDARD',
      }).promise();

      // 构建 S3 URL
      const s3Url = `s3://${this.bucketName}/${s3Key}`;

      // 更新数据库中的归档状态
      await visualizationService.archiveSession(sessionId, s3Url);

      logger.info(`Session ${sessionId} archived to ${s3Url}`);

      return {
        success: true,
        data: s3Url,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to archive session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 从 S3 恢复归档会话
   */
  async restoreSession(sessionId: string, s3Url: string): Promise<ServiceResponse<any>> {
    try {
      if (!this.enabled || !this.s3) {
        return {
          success: false,
          error: 'S3 archiving is not enabled',
          timestamp: new Date().toISOString(),
        };
      }

      // 解析 S3 URL
      const s3Key = s3Url.replace(`s3://${this.bucketName}/`, '');

      // 从 S3 下载
      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: s3Key,
      }).promise();

      if (!result.Body) {
        return {
          success: false,
          error: 'No data found in S3',
          timestamp: new Date().toISOString(),
        };
      }

      // 解压缩
      const compressedData = Buffer.isBuffer(result.Body) ? result.Body : Buffer.from(result.Body as any);
      const decompressedData = await gunzip(compressedData);
      const archiveData = JSON.parse(decompressedData.toString('utf-8'));

      logger.info(`Session ${sessionId} restored from S3`);

      return {
        success: true,
        data: archiveData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to restore session ${sessionId}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 批量归档会话
   */
  async archiveBatch(sessionIds: string[]): Promise<ServiceResponse<{ successful: number; failed: number }>> {
    try {
      let successful = 0;
      let failed = 0;

      for (const sessionId of sessionIds) {
        const result = await this.archiveSession(sessionId);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }

      logger.info(`Batch archive completed: ${successful} successful, ${failed} failed`);

      return {
        success: true,
        data: { successful, failed },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Batch archive failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 删除 S3 中的归档数据
   */
  async deleteArchive(s3Url: string): Promise<ServiceResponse<void>> {
    try {
      if (!this.enabled || !this.s3) {
        return {
          success: false,
          error: 'S3 archiving is not enabled',
          timestamp: new Date().toISOString(),
        };
      }

      const s3Key = s3Url.replace(`s3://${this.bucketName}/`, '');

      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: s3Key,
      }).promise();

      logger.info(`Deleted archive: ${s3Url}`);

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to delete archive ${s3Url}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取归档数据的元信息（不下载完整内容）
   */
  async getArchiveMetadata(s3Url: string): Promise<ServiceResponse<any>> {
    try {
      if (!this.enabled || !this.s3) {
        return {
          success: false,
          error: 'S3 archiving is not enabled',
          timestamp: new Date().toISOString(),
        };
      }

      const s3Key = s3Url.replace(`s3://${this.bucketName}/`, '');

      const result = await this.s3.headObject({
        Bucket: this.bucketName,
        Key: s3Key,
      }).promise();

      const metadata = {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        metadata: result.Metadata,
      };

      return {
        success: true,
        data: metadata,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Failed to get archive metadata for ${s3Url}:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 检查 S3 连接和权限
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.enabled || !this.s3) {
        logger.warn('S3 archiving is not enabled');
        return false;
      }

      // 尝试列出存储桶（测试权限）
      await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        MaxKeys: 1,
      }).promise();

      logger.info('S3 connection test successful');
      return true;
    } catch (error: any) {
      logger.error('S3 connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取存储桶统计信息
   */
  async getBucketStats(): Promise<ServiceResponse<{ totalObjects: number; totalSize: number }>> {
    try {
      if (!this.enabled || !this.s3) {
        return {
          success: false,
          error: 'S3 archiving is not enabled',
          timestamp: new Date().toISOString(),
        };
      }

      let totalObjects = 0;
      let totalSize = 0;
      let continuationToken: string | undefined;

      do {
        const result = await this.s3.listObjectsV2({
          Bucket: this.bucketName,
          ContinuationToken: continuationToken,
        }).promise();

        if (result.Contents) {
          totalObjects += result.Contents.length;
          totalSize += result.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
        }

        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      return {
        success: true,
        data: { totalObjects, totalSize },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to get bucket stats:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default new DataArchiveService();
