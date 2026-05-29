import { DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from './database';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string;
  declare email: string;
  declare username: string | null;
  declare first_name: string | null;
  declare last_name: string | null;
  declare phone: string | null;
  declare avatar_url: string | null;
  declare status: UserStatus;
  declare created_at: Date;
  declare updated_at: Date;
}

User.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  email: { type: DataTypes.STRING(255), allowNull: false },
  username: { type: DataTypes.STRING(100), allowNull: true },
  first_name: { type: DataTypes.STRING(100), allowNull: true },
  last_name: { type: DataTypes.STRING(100), allowNull: true },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  avatar_url: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'), allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'users', timestamps: false });

export class UserAuth extends Model<InferAttributes<UserAuth>, InferCreationAttributes<UserAuth>> {
  declare id: string;
  declare user_id: string;
  declare password_hash: string | null;
  declare password_salt: string | null;
  declare failed_login_attempts: number;
  declare locked_until: Date | null;
  declare password_changed_at: Date | null;
}

UserAuth.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.UUID, allowNull: false },
  password_hash: { type: DataTypes.TEXT, allowNull: true },
  password_salt: { type: DataTypes.TEXT, allowNull: true },
  failed_login_attempts: { type: DataTypes.INTEGER, allowNull: false },
  locked_until: { type: DataTypes.DATE, allowNull: true },
  password_changed_at: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, tableName: 'user_auth', timestamps: false });

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: string;
  declare name: string;
  declare code: string;
  declare description: string | null;
  declare is_system: boolean;
}

Role.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_system: { type: DataTypes.BOOLEAN, allowNull: false },
}, { sequelize, tableName: 'roles', timestamps: false });

export class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: string;
  declare name: string;
  declare code: string;
  declare resource: string;
  declare action: string;
  declare description: string | null;
}

Permission.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(150), allowNull: false },
  resource: { type: DataTypes.STRING(100), allowNull: false },
  action: { type: DataTypes.STRING(50), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'permissions', timestamps: false });

export class UserRole extends Model<InferAttributes<UserRole>, InferCreationAttributes<UserRole>> {
  declare user_id: string;
  declare role_id: string;
  declare assigned_at: Date;
}

UserRole.init({
  user_id: { type: DataTypes.UUID, primaryKey: true },
  role_id: { type: DataTypes.UUID, primaryKey: true },
  assigned_at: { type: DataTypes.DATE, allowNull: false },
}, { sequelize, tableName: 'user_roles', timestamps: false });

export class RolePermission extends Model<InferAttributes<RolePermission>, InferCreationAttributes<RolePermission>> {
  declare role_id: string;
  declare permission_id: string;
}

RolePermission.init({
  role_id: { type: DataTypes.UUID, primaryKey: true },
  permission_id: { type: DataTypes.UUID, primaryKey: true },
}, { sequelize, tableName: 'role_permissions', timestamps: false });

export class UserSession extends Model<InferAttributes<UserSession>, InferCreationAttributes<UserSession>> {
  declare id: string;
  declare user_id: string;
  declare session_token: Buffer;
  declare refresh_token: Buffer;
  declare token_version: number;
  declare device_info: Record<string, unknown> | null;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare expires_at: Date;
  declare refresh_expires_at: Date;
  declare is_active: boolean;
  declare created_at: Date;
  declare last_activity_at: Date;
}

UserSession.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.UUID, allowNull: false },
  session_token: { type: DataTypes.BLOB, allowNull: false },
  refresh_token: { type: DataTypes.BLOB, allowNull: false },
  token_version: { type: DataTypes.INTEGER, allowNull: false },
  device_info: { type: DataTypes.JSONB, allowNull: true },
  ip_address: { type: DataTypes.STRING, allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  refresh_expires_at: { type: DataTypes.DATE, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false },
  last_activity_at: { type: DataTypes.DATE, allowNull: false },
}, { sequelize, tableName: 'user_sessions', timestamps: false });

User.hasOne(UserAuth, { foreignKey: 'user_id', as: 'auth' });
UserAuth.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserSession, { foreignKey: 'user_id', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });
