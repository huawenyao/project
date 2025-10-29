/**
 * Component Routes
 * T055: 实现组件配置 API
 *
 * PUT /api/projects/:id/components - 批量更新项目组件
 * GET /api/projects/:id/components - 获取项目组件列表
 * POST /api/projects/:id/components - 创建单个组件
 * PUT /api/projects/:id/components/:componentId - 更新单个组件
 * DELETE /api/projects/:id/components/:componentId - 删除单个组件
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import codeGenerationService from '../services/CodeGenerationService';
import versionService from '../services/VersionService';

const router = Router();
const prisma = new PrismaClient();

// 所有路由都需要认证
router.use(authenticate);

/**
 * GET /api/projects/:id/components
 * 获取项目的所有组件
 */
router.get('/:id/components', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 验证项目权限
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权访问此项目',
      });
      return;
    }

    const components = await prisma.component.findMany({
      where: { projectId: id },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: { components },
      message: '获取组件列表成功',
    });
  } catch (error: any) {
    logger.error('Get components error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get components',
      message: '获取组件列表失败',
    });
  }
});

/**
 * POST /api/projects/:id/components
 * 创建单个组件
 */
router.post('/:id/components', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, name, props, styles, dataBinding, events, parentId, order } = req.body;

    // 验证必填字段
    if (!type || !name) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '缺少必填字段：type, name',
      });
      return;
    }

    // 验证项目权限
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    const component = await prisma.component.create({
      data: {
        projectId: id,
        type,
        name,
        props: props || {},
        styles: styles || {},
        dataBinding: dataBinding || null,
        events: events || null,
        parentId: parentId || null,
        order: order || 0,
      },
    });

    // 创建版本快照
    try {
      await versionService.createSnapshot(
        id,
        req.user!.userId,
        `添加组件: ${name}`
      );
    } catch (versionError) {
      logger.warn('Failed to create version snapshot:', versionError);
    }

    res.status(201).json({
      success: true,
      data: { component },
      message: '创建组件成功',
    });
  } catch (error: any) {
    logger.error('Create component error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create component',
      message: '创建组件失败',
    });
  }
});

/**
 * PUT /api/projects/:id/components
 * 批量更新项目组件
 * T055: 主要实现的API
 */
router.put('/:id/components', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { components, createSnapshot = true } = req.body;

    if (!components || !Array.isArray(components)) {
      res.status(400).json({
        success: false,
        error: 'Invalid components data',
        message: 'components必须是数组',
      });
      return;
    }

    // 验证项目权限
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    // 创建版本快照（如果请求）
    if (createSnapshot) {
      try {
        await versionService.createSnapshot(
          id,
          req.user!.userId,
          '批量更新组件前的备份'
        );
      } catch (versionError) {
        logger.warn('Failed to create version snapshot:', versionError);
      }
    }

    // 使用事务批量更新组件
    const result = await prisma.$transaction(async (tx) => {
      const updatedComponents = [];

      for (const comp of components) {
        if (!comp.id) {
          // 创建新组件
          const newComp = await tx.component.create({
            data: {
              projectId: id,
              type: comp.type,
              name: comp.name,
              props: comp.props || {},
              styles: comp.styles || {},
              dataBinding: comp.dataBinding || null,
              events: comp.events || null,
              parentId: comp.parentId || null,
              order: comp.order || 0,
            },
          });
          updatedComponents.push(newComp);
        } else {
          // 更新现有组件
          const updated = await tx.component.update({
            where: { id: comp.id },
            data: {
              type: comp.type,
              name: comp.name,
              props: comp.props,
              styles: comp.styles,
              dataBinding: comp.dataBinding,
              events: comp.events,
              parentId: comp.parentId,
              order: comp.order,
            },
          });
          updatedComponents.push(updated);
        }
      }

      return updatedComponents;
    });

    res.status(200).json({
      success: true,
      data: { components: result },
      message: '批量更新组件成功',
    });
  } catch (error: any) {
    logger.error('Batch update components error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update components',
      message: '批量更新组件失败',
    });
  }
});

/**
 * PUT /api/projects/:id/components/:componentId
 * 更新单个组件
 */
router.put('/:id/components/:componentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, componentId } = req.params;
    const { type, name, props, styles, dataBinding, events, parentId, order } = req.body;

    // 验证项目权限
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    // 验证组件是否属于该项目
    const existingComponent = await prisma.component.findUnique({
      where: { id: componentId },
      select: { projectId: true },
    });

    if (!existingComponent || existingComponent.projectId !== id) {
      res.status(404).json({
        success: false,
        error: 'Component not found',
        message: '组件不存在或不属于该项目',
      });
      return;
    }

    const component = await prisma.component.update({
      where: { id: componentId },
      data: {
        ...(type && { type }),
        ...(name && { name }),
        ...(props && { props }),
        ...(styles && { styles }),
        ...(dataBinding !== undefined && { dataBinding }),
        ...(events !== undefined && { events }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order }),
      },
    });

    res.status(200).json({
      success: true,
      data: { component },
      message: '更新组件成功',
    });
  } catch (error: any) {
    logger.error('Update component error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update component',
      message: '更新组件失败',
    });
  }
});

/**
 * DELETE /api/projects/:id/components/:componentId
 * 删除单个组件
 */
router.delete('/:id/components/:componentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, componentId } = req.params;

    // 验证项目权限
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    // 验证组件是否属于该项目
    const existingComponent = await prisma.component.findUnique({
      where: { id: componentId },
      select: { projectId: true, name: true },
    });

    if (!existingComponent || existingComponent.projectId !== id) {
      res.status(404).json({
        success: false,
        error: 'Component not found',
        message: '组件不存在或不属于该项目',
      });
      return;
    }

    await prisma.component.delete({
      where: { id: componentId },
    });

    // 创建版本快照
    try {
      await versionService.createSnapshot(
        id,
        req.user!.userId,
        `删除组件: ${existingComponent.name}`
      );
    } catch (versionError) {
      logger.warn('Failed to create version snapshot:', versionError);
    }

    res.status(200).json({
      success: true,
      message: '删除组件成功',
    });
  } catch (error: any) {
    logger.error('Delete component error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete component',
      message: '删除组件失败',
    });
  }
});

/**
 * POST /api/projects/:id/components/generate
 * 使用AI生成组件（从自然语言描述）
 * T054: 调用 UIAgent.generateComponents
 */
router.post('/:id/components/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, autoSave = false } = req.body;

    if (!description) {
      res.status(400).json({
        success: false,
        error: 'Missing description',
        message: '缺少描述字段',
      });
      return;
    }

    // 验证项目权限
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found',
        message: '项目不存在',
      });
      return;
    }

    if (project.userId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '无权操作此项目',
      });
      return;
    }

    // 使用 CodeGenerationService 生成组件
    const result = await codeGenerationService.generateComponentsFromNL(description);

    if (!result.success || !result.data) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate components',
        message: '生成组件失败',
      });
      return;
    }

    // 如果启用自动保存，将组件保存到数据库
    if (autoSave) {
      const components = result.data.map((item: any) => item.component);

      const savedComponents = await prisma.$transaction(
        components.map((comp: any) =>
          prisma.component.create({
            data: {
              projectId: id,
              type: comp.type,
              name: comp.name,
              props: comp.props || {},
              styles: comp.styles || {},
              dataBinding: comp.dataBinding || null,
              events: comp.events || null,
              parentId: comp.parentId || null,
              order: comp.order || 0,
            },
          })
        )
      );

      // 创建版本快照
      try {
        await versionService.createSnapshot(
          id,
          req.user!.userId,
          `AI生成组件: ${description.substring(0, 50)}`
        );
      } catch (versionError) {
        logger.warn('Failed to create version snapshot:', versionError);
      }

      res.status(201).json({
        success: true,
        data: {
          components: savedComponents,
          generated: result.data,
        },
        message: 'AI生成并保存组件成功',
      });
    } else {
      // 仅返回生成的组件，不保存
      res.status(200).json({
        success: true,
        data: {
          components: result.data.map((item: any) => item.component),
          generated: result.data,
        },
        message: 'AI生成组件成功',
      });
    }
  } catch (error: any) {
    logger.error('Generate components error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate components',
      message: 'AI生成组件失败',
    });
  }
});

export default router;
