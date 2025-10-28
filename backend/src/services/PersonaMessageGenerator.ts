/**
 * Persona Message Generator
 *
 * T097: [US3] Implement professional-friendly message templates
 * 生成 Agent 的个性化、专业友好的状态消息
 */

import { AgentType, AgentStatus } from './AgentStatusTracker';
import logger from '../utils/logger';

export type PersonalityTone = 'professional' | 'friendly' | 'technical' | 'enthusiastic' | 'calm';

interface MessageTemplate {
  status: AgentStatus;
  templates: string[];
}

class PersonaMessageGenerator {
  /**
   * 根据 Agent 类型和状态生成友好消息
   */
  generateStatusMessage(
    agentType: AgentType,
    status: AgentStatus,
    taskDescription: string,
    tone: PersonalityTone = 'professional'
  ): string {
    const templates = this.getTemplates(agentType, status, tone);
    const template = templates[Math.floor(Math.random() * templates.length)];

    return this.interpolateTemplate(template, taskDescription, status);
  }

  /**
   * 获取消息模板
   */
  private getTemplates(agentType: AgentType, status: AgentStatus, tone: PersonalityTone): string[] {
    const templates: Record<AgentStatus, Record<PersonalityTone, string[]>> = {
      pending: {
        professional: [
          '准备开始：{task}',
          '待命中，即将开始{task}',
          '等待执行：{task}',
        ],
        friendly: [
          '✨ 准备好了！即将开始{task}',
          '🎯 待命中～马上开始{task}',
          '⏳ 等待中，准备开始{task}',
        ],
        technical: [
          '[PENDING] 等待执行：{task}',
          '系统就绪，待命中：{task}',
          '初始化完成，等待启动：{task}',
        ],
        enthusiastic: [
          '🚀 准备就绪！让我们开始{task}吧！',
          '💪 蓄势待发！即将开始{task}',
          '⚡ 能量满满！准备开始{task}',
        ],
        calm: [
          '平稳待命，即将开始{task}',
          '准备就绪，等待开始{task}',
          '系统稳定，准备执行{task}',
        ],
      },
      in_progress: {
        professional: [
          '正在进行：{task}',
          '执行中：{task}',
          '工作中：{task}',
        ],
        friendly: [
          '✨ 正在努力{task}中...',
          '🔨 辛勤工作中：{task}',
          '💼 专心致志地{task}',
        ],
        technical: [
          '[RUNNING] 执行中：{task}',
          '进程运行中：{task}',
          '任务执行：{task}',
        ],
        enthusiastic: [
          '🚀 全力冲刺！正在{task}',
          '💪 热情工作中：{task}',
          '⚡ 快速执行中：{task}',
        ],
        calm: [
          '稳步推进中：{task}',
          '专注执行：{task}',
          '有序进行中：{task}',
        ],
      },
      completed: {
        professional: [
          '✓ 已完成：{task}',
          '任务完成：{task}',
          '执行成功：{task}',
        ],
        friendly: [
          '✅ 太棒了！{task}已完成',
          '🎉 搞定了！{task}完成',
          '👍 完美完成：{task}',
        ],
        technical: [
          '[COMPLETED] 任务完成：{task}',
          '执行成功：{task}（状态：OK）',
          '任务结束：{task}（正常）',
        ],
        enthusiastic: [
          '🎊 完美完成！{task}大功告成',
          '🌟 太棒了！{task}顺利完成',
          '🏆 成功！{task}执行完毕',
        ],
        calm: [
          '✓ 顺利完成：{task}',
          '任务完成：{task}（稳定）',
          '执行完毕：{task}',
        ],
      },
      failed: {
        professional: [
          '✗ 执行失败：{task}',
          '任务失败：{task}',
          '执行出错：{task}',
        ],
        friendly: [
          '😔 哎呀，{task}遇到问题了',
          '⚠️ 遇到困难：{task}失败',
          '💔 很抱歉，{task}未能完成',
        ],
        technical: [
          '[ERROR] 执行失败：{task}',
          '任务异常：{task}（失败）',
          '执行错误：{task}（状态：FAILED）',
        ],
        enthusiastic: [
          '😰 出问题了！{task}失败',
          '⚠️ 哎呀！{task}遇到障碍',
          '💥 抱歉！{task}未能完成',
        ],
        calm: [
          '遇到问题：{task}失败',
          '执行中断：{task}',
          '任务异常：{task}',
        ],
      },
      retrying: {
        professional: [
          '↻ 正在重试：{task}',
          '重新尝试：{task}',
          '执行重试中：{task}',
        ],
        friendly: [
          '🔄 再试一次！正在重试{task}',
          '💪 不放弃！重新执行{task}',
          '🔁 让我们再试一次：{task}',
        ],
        technical: [
          '[RETRY] 重试中：{task}',
          '执行重试：{task}（尝试中）',
          '自动重试：{task}',
        ],
        enthusiastic: [
          '💪 坚持住！正在重试{task}',
          '🔥 再来一次！重新执行{task}',
          '⚡ 不放弃！重试{task}中',
        ],
        calm: [
          '重新尝试：{task}',
          '稳定重试中：{task}',
          '执行重试：{task}',
        ],
      },
      skipped: {
        professional: [
          '⊘ 已跳过：{task}',
          '任务跳过：{task}',
          '未执行：{task}',
        ],
        friendly: [
          '⏭️ 跳过了{task}',
          '🚫 这次不执行：{task}',
          '💨 跳过：{task}',
        ],
        technical: [
          '[SKIPPED] 任务跳过：{task}',
          '未执行：{task}（跳过）',
          '任务忽略：{task}',
        ],
        enthusiastic: [
          '⏭️ 跳过！不执行{task}',
          '🚀 直接跳过：{task}',
          '💨 快速跳过：{task}',
        ],
        calm: [
          '已跳过：{task}',
          '未执行：{task}',
          '任务跳过：{task}',
        ],
      },
    };

    return templates[status]?.[tone] || templates[status]?.professional || ['{task}'];
  }

  /**
   * 插值模板
   */
  private interpolateTemplate(template: string, taskDescription: string, status: AgentStatus): string {
    let message = template.replace('{task}', taskDescription);

    // 根据状态添加额外的符号
    if (status === 'completed') {
      message = message.replace('✓', '✅').replace('✗', '');
    } else if (status === 'failed') {
      message = message.replace('✓', '').replace('✗', '❌');
    }

    return message;
  }

  /**
   * 生成进度描述
   */
  generateProgressMessage(
    progressPercentage: number,
    currentOperation: string,
    tone: PersonalityTone = 'professional'
  ): string {
    const progress = Math.round(progressPercentage);

    if (progress < 25) {
      const messages = {
        professional: `开始阶段（${progress}%）：${currentOperation}`,
        friendly: `🌱 刚开始（${progress}%）：${currentOperation}`,
        technical: `[${progress}%] 初始阶段：${currentOperation}`,
        enthusiastic: `🚀 起步阶段（${progress}%）：${currentOperation}`,
        calm: `起步阶段（${progress}%）：${currentOperation}`,
      };
      return messages[tone] || messages.professional;
    } else if (progress < 50) {
      const messages = {
        professional: `进行中（${progress}%）：${currentOperation}`,
        friendly: `🔨 进展顺利（${progress}%）：${currentOperation}`,
        technical: `[${progress}%] 执行中：${currentOperation}`,
        enthusiastic: `💪 加速中（${progress}%）：${currentOperation}`,
        calm: `平稳推进（${progress}%）：${currentOperation}`,
      };
      return messages[tone] || messages.professional;
    } else if (progress < 75) {
      const messages = {
        professional: `进展良好（${progress}%）：${currentOperation}`,
        friendly: `✨ 过半了！（${progress}%）：${currentOperation}`,
        technical: `[${progress}%] 中期阶段：${currentOperation}`,
        enthusiastic: `🔥 势头正猛！（${progress}%）：${currentOperation}`,
        calm: `稳步前进（${progress}%）：${currentOperation}`,
      };
      return messages[tone] || messages.professional;
    } else if (progress < 100) {
      const messages = {
        professional: `即将完成（${progress}%）：${currentOperation}`,
        friendly: `🎯 快完成了！（${progress}%）：${currentOperation}`,
        technical: `[${progress}%] 收尾阶段：${currentOperation}`,
        enthusiastic: `🌟 冲刺阶段！（${progress}%）：${currentOperation}`,
        calm: `收尾阶段（${progress}%）：${currentOperation}`,
      };
      return messages[tone] || messages.professional;
    } else {
      const messages = {
        professional: `✓ 已完成（100%）：${currentOperation}`,
        friendly: `🎉 大功告成！（100%）：${currentOperation}`,
        technical: `[100%] 完成：${currentOperation}`,
        enthusiastic: `🏆 完美完成！（100%）：${currentOperation}`,
        calm: `顺利完成（100%）：${currentOperation}`,
      };
      return messages[tone] || messages.professional;
    }
  }

  /**
   * 生成 Agent 欢迎消息
   */
  generateWelcomeMessage(agentType: AgentType, displayName: string, tone: PersonalityTone = 'professional'): string {
    const messages: Record<PersonalityTone, string> = {
      professional: `${displayName}已就绪，准备开始工作`,
      friendly: `✨ ${displayName}来啦！准备好帮忙了`,
      technical: `[READY] ${displayName}系统已初始化`,
      enthusiastic: `🚀 ${displayName}蓄势待发！让我们大干一场吧`,
      calm: `${displayName}已准备就绪，等待指令`,
    };

    return messages[tone] || messages.professional;
  }

  /**
   * 生成错误消息
   */
  generateErrorMessage(errorMessage: string, retryCount: number, maxRetry: number, tone: PersonalityTone = 'professional'): string {
    const remaining = maxRetry - retryCount;

    if (remaining > 0) {
      const messages: Record<PersonalityTone, string> = {
        professional: `遇到错误：${errorMessage}。将进行重试（剩余${remaining}次）`,
        friendly: `😔 出错了：${errorMessage}。别担心，我会再试${remaining}次`,
        technical: `[ERROR] ${errorMessage}（重试：${retryCount}/${maxRetry}）`,
        enthusiastic: `💪 遇到问题：${errorMessage}。不放弃！还能试${remaining}次`,
        calm: `错误：${errorMessage}。稳定重试中（剩余${remaining}次）`,
      };
      return messages[tone] || messages.professional;
    } else {
      const messages: Record<PersonalityTone, string> = {
        professional: `错误：${errorMessage}。已达最大重试次数`,
        friendly: `😢 很抱歉：${errorMessage}。已尝试${maxRetry}次，暂时无法完成`,
        technical: `[FATAL] ${errorMessage}（重试次数已耗尽：${maxRetry}/${maxRetry}）`,
        enthusiastic: `💔 非常抱歉：${errorMessage}。已全力尝试${maxRetry}次`,
        calm: `错误：${errorMessage}。重试次数已用完（${maxRetry}次）`,
      };
      return messages[tone] || messages.professional;
    }
  }
}

// 导出单例
export const personaMessageGenerator = new PersonaMessageGenerator();
export default personaMessageGenerator;
