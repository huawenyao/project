/**
 * Database Migration Script
 * 执行所有可视化系统的数据库迁移
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_builder_studio';

const migrationFiles = [
  '001_create_build_sessions.sql',
  '002_create_agent_work_status.sql',
  '003_create_decision_records.sql',
  '004_create_agent_error_records.sql',
  '005_create_collaboration_events.sql',
  '006_create_preview_data.sql',
  '007_create_agent_personas.sql',
  '008_create_user_interaction_metrics.sql',
  '009_create_indexes.sql',
  '010_seed_agent_personas.sql'
];

async function runMigrations() {
  const pool = new Pool({
    connectionString: DATABASE_URL
  });

  try {
    logger.info('Starting database migrations...');

    for (const filename of migrationFiles) {
      const filePath = path.join(__dirname, '../../migrations', filename);

      if (!fs.existsSync(filePath)) {
        logger.error(`Migration file not found: ${filename}`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`Executing migration: ${filename}`);
      await pool.query(sql);
      logger.info(`✓ Completed: ${filename}`);
    }

    logger.info('All migrations completed successfully!');
  } catch (error: any) {
    logger.error('Migration failed:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await pool.end();
  }
}

// 执行迁移
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
