import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  SSO_LOGIN_PRIMARY_URL: Joi.string().uri().required(),
  MONGODB_AUDIT_URL: Joi.string().uri().required(),
  OIDC_ISSUER: Joi.string().uri().required(),
  SESSION_SECRET: Joi.string().min(32).required(),
});
