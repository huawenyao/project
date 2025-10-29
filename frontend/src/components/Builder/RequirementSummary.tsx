/**
 * Requirement Summary Component
 *
 * Phase 3 - User Story 1: 自然语言应用创建
 * T031: 需求摘要组件 - 显示AI解析后的需求理解
 */

import React from 'react';
import { Card, Tag, Button, Divider, Typography, Space, List, Row, Col } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ApiOutlined,
  MobileOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { RequirementAnalysis } from '../../services/nlpService';

const { Title, Text, Paragraph } = Typography;

export interface RequirementSummaryProps {
  analysis: RequirementAnalysis;
  onEdit?: () => void;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

export const RequirementSummary: React.FC<RequirementSummaryProps> = ({
  analysis,
  onEdit,
  onConfirm,
  isConfirming = false,
}) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'success';
      case 'medium':
        return 'warning';
      case 'complex':
        return 'error';
      default:
        return 'default';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return '简单';
      case 'medium':
        return '中等';
      case 'complex':
        return '复杂';
      default:
        return complexity;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
  };

  return (
    <Card
      className="requirement-summary"
      bordered
      style={{ maxWidth: 900, margin: '0 auto' }}
    >
      {/* 头部 */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              需求理解摘要
            </Title>
            {onEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={onEdit}
                type="link"
              >
                修改需求
              </Button>
            )}
          </div>
          <Text type="secondary">
            AI 已经分析并理解了您的需求，请确认以下信息是否准确
          </Text>
        </Space>
      </div>

      <Divider />

      {/* 应用信息 */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text strong>应用类型</Text>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                {analysis.appType}
              </Tag>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text strong>应用分类</Text>
              <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>
                {analysis.appCategory}
              </Tag>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text strong>复杂度</Text>
              <Tag
                color={getComplexityColor(analysis.complexity)}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {getComplexityText(analysis.complexity)}
              </Tag>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="small">
              <Text strong>
                <ClockCircleOutlined /> 预计构建时间
              </Text>
              <Text style={{ fontSize: 14 }}>
                {formatDuration(analysis.estimatedDuration)}
              </Text>
            </Space>
          </Col>
        </Row>

        {/* 功能列表 */}
        <div>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
            <ThunderboltOutlined /> 核心功能
          </Text>
          <List
            dataSource={analysis.features}
            renderItem={(feature) => (
              <List.Item style={{ padding: '8px 0', border: 'none' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text>{feature}</Text>
              </List.Item>
            )}
            bordered={false}
          />
        </div>

        {/* 数据实体 */}
        <div>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
            <DatabaseOutlined /> 数据实体
          </Text>
          <Space wrap>
            {analysis.entities.map((entity, index) => (
              <Tag key={index} color="cyan" style={{ fontSize: 13, padding: '4px 10px' }}>
                {entity}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 技术栈 */}
        <div>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
            <ApiOutlined /> 技术栈
          </Text>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Space direction="vertical" size="small">
                <Text type="secondary">
                  <MobileOutlined /> 前端
                </Text>
                <Space wrap>
                  {analysis.techStack.frontend.map((tech, index) => (
                    <Tag key={index} color="blue">
                      {tech}
                    </Tag>
                  ))}
                </Space>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size="small">
                <Text type="secondary">
                  <ApiOutlined /> 后端
                </Text>
                <Space wrap>
                  {analysis.techStack.backend.map((tech, index) => (
                    <Tag key={index} color="green">
                      {tech}
                    </Tag>
                  ))}
                </Space>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size="small">
                <Text type="secondary">
                  <DatabaseOutlined /> 数据库
                </Text>
                <Space wrap>
                  {analysis.techStack.database.map((tech, index) => (
                    <Tag key={index} color="purple">
                      {tech}
                    </Tag>
                  ))}
                </Space>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 用户角色 */}
        {analysis.userRoles && analysis.userRoles.length > 0 && (
          <div>
            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
              <TeamOutlined /> 用户角色
            </Text>
            <Space wrap>
              {analysis.userRoles.map((role, index) => (
                <Tag key={index} color="orange" style={{ fontSize: 13, padding: '4px 10px' }}>
                  {role}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 第三方集成 */}
        {analysis.thirdPartyIntegrations && analysis.thirdPartyIntegrations.length > 0 && (
          <div>
            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
              <ApiOutlined /> 第三方集成
            </Text>
            <Space wrap>
              {analysis.thirdPartyIntegrations.map((integration, index) => (
                <Tag key={index} color="geekblue" style={{ fontSize: 13, padding: '4px 10px' }}>
                  {integration}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 置信度 */}
        <div
          style={{
            background: analysis.confidence >= 0.85 ? '#f6ffed' : '#fff7e6',
            border: `1px solid ${analysis.confidence >= 0.85 ? '#b7eb8f' : '#ffd591'}`,
            borderRadius: 8,
            padding: 16,
            marginTop: 16,
          }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Text strong>AI 理解置信度：</Text>
              <Tag
                color={analysis.confidence >= 0.85 ? 'success' : 'warning'}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {Math.round(analysis.confidence * 100)}%
              </Tag>
            </Space>
            {analysis.confidence < 0.85 && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                💡 置信度较低，建议补充更多细节或使用对话模式澄清需求
              </Text>
            )}
          </Space>
        </div>
      </Space>

      {/* 确认按钮 */}
      {onConfirm && (
        <>
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">
              {onEdit && (
                <Button size="large" onClick={onEdit}>
                  修改需求
                </Button>
              )}
              <Button
                type="primary"
                size="large"
                onClick={onConfirm}
                loading={isConfirming}
                icon={<CheckCircleOutlined />}
              >
                确认无误，开始构建
              </Button>
            </Space>
          </div>
        </>
      )}
    </Card>
  );
};

export default RequirementSummary;
