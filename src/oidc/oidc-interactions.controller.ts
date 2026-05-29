import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuditLoggerService } from '../audit/audit-logger.service';
import { AUDIT_EVENTS } from '../common/constants/audit-events.constant';
import { OidcProviderService } from './oidc-provider.service';

@Controller('oidc/interaction')
export class OidcInteractionsController {
  constructor(
    private readonly oidc: OidcProviderService,
    private readonly auth: AuthService,
    private readonly audit: AuditLoggerService,
  ) {}

  @Get(':uid')
  async interaction(@Param('uid') uid: string, @Req() req: any, @Res() res: any) {
    const details = await this.oidc.instance.interactionDetails(req, res);

    if (details.prompt.name === 'consent') {
      const result = await this.buildConsentResult(details);
      return this.oidc.instance.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    }

    return res.render('login', {
      uid,
      client: details.params.client_id,
      error: undefined,
    });
  }

  @Post(':uid/login')
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

      return this.oidc.instance.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (e) {
      await this.audit.log({
        eventType: AUDIT_EVENTS.LOGIN_FAILED,
        status: 'failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      });

      return res.status(401).render('login', {
        uid,
        error: 'Email hoặc mật khẩu không hợp lệ',
      });
    }
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
