import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  SSO_LOGIN_PRIMARY_URL: Joi.string().uri().required(),
  MONGODB_AUDIT_URL: Joi.string().uri().required(),
  OIDC_ISSUER: Joi.string().uri().required(),
  SESSION_SECRET: Joi.string().min(32).required(),
  SSO_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  SSO_RATE_LIMIT_TTL: Joi.number().default(60_000),
  SSO_RATE_LIMIT_LOGIN_LIMIT: Joi.number().default(10),
  SSO_RATE_LIMIT_TOKEN_LIMIT: Joi.number().default(30),
  SSO_BRUTE_FORCE_LOCKOUT_THRESHOLD: Joi.number().default(5),
  SSO_BRUTE_FORCE_LOCKOUT_DURATION_MINUTES: Joi.number().default(15),
});
