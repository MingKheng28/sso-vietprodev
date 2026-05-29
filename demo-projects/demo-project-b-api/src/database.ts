import { Sequelize } from 'sequelize';
import { config } from './config';

export const sequelize = new Sequelize(config.databaseUrl, { dialect: 'postgres', logging: false });

export async function assertDatabaseConnection() {
  await sequelize.authenticate();
}
