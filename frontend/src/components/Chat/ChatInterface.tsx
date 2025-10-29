/**
 * Chat Interface Component
 *
 * Phase 3 - User Story 1: 自然语言应用创建
 * T032: 对话式交互界面 - 支持多轮对话和需求澄清
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Avatar, Typography, Spin, Empty } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: {
    type?: 'clarification' | 'suggestion' | 'confirmation';
    options?: string[];
  };
}

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSelectOption?: (option: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onSelectOption,
  isLoading = false,
  placeholder = '输入您的消息...',
  disabled = false,
  maxHeight = 600,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptionClick = (option: string) => {
    if (onSelectOption && !isLoading && !disabled) {
      onSelectOption(option);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      className="chat-interface"
      bordered
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px',
          maxHeight,
        }}
      >
        {messages.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="开始对话"
            style={{ marginTop: 100 }}
          />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                {/* 头像 */}
                <Avatar
                  size="large"
                  icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
                    flexShrink: 0,
                  }}
                />

                {/* 消息内容 */}
                <div
                  style={{
                    flex: 1,
                    maxWidth: '70%',
                  }}
                >
                  <div
                    style={{
                      background: message.role === 'user' ? '#1890ff' : '#f0f0f0',
                      color: message.role === 'user' ? '#fff' : '#000',
                      padding: '12px 16px',
                      borderRadius: 12,
                      borderTopLeftRadius: message.role === 'user' ? 12 : 4,
                      borderTopRightRadius: message.role === 'user' ? 4 : 12,
                    }}
                  >
                    <Paragraph
                      style={{
                        margin: 0,
                        color: message.role === 'user' ? '#fff' : '#000',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.content}
                    </Paragraph>

                    {/* 选项按钮 */}
                    {message.metadata?.options && message.metadata.options.length > 0 && (
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: '100%', marginTop: 12 }}
                      >
                        {message.metadata.options.map((option, index) => (
                          <Button
                            key={index}
                            block
                            onClick={() => handleOptionClick(option)}
                            disabled={isLoading || disabled}
                            style={{
                              textAlign: 'left',
                              height: 'auto',
                              padding: '8px 12px',
                            }}
                          >
                            {option}
                          </Button>
                        ))}
                      </Space>
                    )}
                  </div>

                  {/* 时间戳 */}
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      display: 'block',
                      textAlign: message.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </div>
              </div>
            ))}

            {/* 加载指示器 */}
            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <Avatar
                  size="large"
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: '#52c41a', flexShrink: 0 }}
                />
                <div
                  style={{
                    background: '#f0f0f0',
                    padding: '12px 16px',
                    borderRadius: 12,
                    borderTopLeftRadius: 4,
                  }}
                >
                  <Space>
                    <Spin indicator={<LoadingOutlined spin />} />
                    <Text type="secondary">AI 正在思考...</Text>
                  </Space>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </Space>
        )}
      </div>

      {/* 输入框 */}
      <div
        style={{
          borderTop: '1px solid #f0f0f0',
          padding: 16,
          background: '#fafafa',
        }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || disabled}
            loading={isLoading}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </Space.Compact>

        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          按 Enter 发送，Shift + Enter 换行
        </Text>
      </div>
    </Card>
  );
};

export default ChatInterface;
