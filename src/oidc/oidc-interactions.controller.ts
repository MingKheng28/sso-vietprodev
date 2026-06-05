import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth/auth.service';
import { AuditLoggerService } from '../audit/audit-logger.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../auth/password.service';
import { AUDIT_EVENTS } from '../common/constants/audit-events.constant';
import { OidcProviderService } from './oidc-provider.service';

@Controller('oidc/interaction')
export class OidcInteractionsController {
  constructor(
    private readonly oidc: OidcProviderService,
    private readonly auth: AuthService,
    private readonly audit: AuditLoggerService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
  ) {}

  @Get(':uid')
  async interaction(@Param('uid') uid: string, @Req() req: any, @Res() res: any) {
    const details = await this.oidc.instance.interactionDetails(req, res);

    if (details.prompt.name === 'consent') {
      return res.render('consent', {
        uid,
        client: details.params.client_id,
        csrfToken: req.csrfToken?.() ?? '',
      });
    }

    return res.render('login', {
      uid,
      client: details.params.client_id,
      error: undefined,
      csrfToken: req.csrfToken?.() ?? '',
    });
  }

  @Get(':uid/register')
  async registerPage(@Param('uid') uid: string, @Req() req: any, @Res() res: any) {
    return res.render('register', {
      uid,
      error: undefined,
      csrfToken: req.csrfToken?.() ?? '',
    });
  }

  @Post(':uid/register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(@Param('uid') uid: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const { email, username, password, confirmPassword } = body;

    if (!email || !password) {
      return res.status(400).render('register', {
        uid,
        error: 'Email và mật khẩu là bắt buộc',
        csrfToken: req.csrfToken?.() ?? '',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('register', {
        uid,
        error: 'Mật khẩu xác nhận không khớp',
        csrfToken: req.csrfToken?.() ?? '',
      });
    }

    if (password.length < 12) {
      return res.status(400).render('register', {
        uid,
        error: 'Mật khẩu phải có ít nhất 12 ký tự',
        csrfToken: req.csrfToken?.() ?? '',
      });
    }

    try {
      const existingEmail = await this.users.findByEmail(email);
      if (existingEmail) {
        return res.status(400).render('register', {
          uid,
          error: 'Email đã được sử dụng',
          csrfToken: req.csrfToken?.() ?? '',
        });
      }

      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const derivedUsername = username || email.split('@')[0];
      const existingUsername = await this.users.findByUsername(derivedUsername);
      if (existingUsername) {
        return res.status(400).render('register', {
          uid,
          error: 'Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.',
          csrfToken: req.csrfToken?.() ?? '',
        });
      }

      const passwordHash = await this.passwords.hash(password);
      const user = await this.users.create({
        email,
        username: derivedUsername,
        password_hash: passwordHash,
      });

      await this.audit.log({
        eventType: AUDIT_EVENTS.REGISTER_SUCCESS,
        userId: user.id,
        status: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      const result = {
        login: {
          accountId: user.id,
          remember: false,
          ts: Math.floor(Date.now() / 1000),
        },
      };

      return this.oidc.instance.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (e: any) {
      const isUniqueViolation = e.code === '23505';
      await this.audit.log({
        eventType: AUDIT_EVENTS.REGISTER_FAILED,
        status: 'failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      return res.status(400).render('register', {
        uid,
        error: isUniqueViolation
          ? 'Email hoặc tên đăng nhập đã tồn tại. Vui lòng thử lại.'
          : 'Không thể tạo tài khoản. Vui lòng thử lại.',
        csrfToken: req.csrfToken?.() ?? '',
      });
    }
  }

  @Post(':uid/login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async submit(@Param('uid') uid: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      const user = await this.auth.validateUser(body.email, body.password);
      await this.audit.log({
        eventType: AUDIT_EVENTS.LOGIN_SUCCESS,
        userId: user.id,
        status: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      const result = {
        login: {
          accountId: user.id,
          remember: Boolean(body.remember),
          ts: Math.floor(Date.now() / 1000),
        },
      };

      return this.oidc.instance.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (e: any) {
      const status = e.getStatus?.() ?? 401;
      const isLockout = status === 429;

      await this.audit.log({
        eventType: AUDIT_EVENTS.LOGIN_FAILED,
        status: 'failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      return res.status(status).render('login', {
        uid,
        error: isLockout ? e.message : 'Email hoặc mật khẩu không hợp lệ',
        csrfToken: req.csrfToken?.() ?? '',
      });
    }
  }

  @Post(':uid/confirm')
  async confirmConsent(
    @Param('uid') uid: string,
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    const details = await this.oidc.instance.interactionDetails(req, res);
    const result = await this.buildConsentResult(details);
    return this.oidc.instance.interactionFinished(req, res, result, {
      mergeWithLastSubmission: true,
    });
  }

  @Post(':uid/cancel')
  async cancelConsent(@Param('uid') uid: string, @Req() req: any, @Res() res: any) {
    return this.oidc.instance.interactionFinished(
      req,
      res,
      { error: 'access_denied', error_description: 'User cancelled the request' },
      { mergeWithLastSubmission: false },
    );
  }

  private async buildConsentResult(details: any) {
    const { prompt, grantId, session, params } = details;
    let grant: any;

    if (grantId) {
      grant = await this.oidc.instance.Grant.find(grantId);
    } else {
      grant = new this.oidc.instance.Grant({
        accountId: session.accountId,
        clientId: params.client_id,
      });
    }

    if (prompt.details?.missingOIDCScope) {
      grant.addOIDCScope(prompt.details.missingOIDCScope.join(' '));
    }

    if (prompt.details?.missingOIDCClaims) {
      grant.addOIDCClaims(prompt.details.missingOIDCClaims);
    }

    if (prompt.details?.missingResourceScopes) {
      for (const [indicator, scopes] of Object.entries(prompt.details.missingResourceScopes)) {
        grant.addResourceScope(indicator, (scopes as string[]).join(' '));
      }
    }

    return { consent: { grantId: await grant.save() } };
  }
}
