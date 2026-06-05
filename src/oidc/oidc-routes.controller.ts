import { All, Controller, Req, Res } from '@nestjs/common';
import { OidcProviderService } from './oidc-provider.service';

@Controller()
export class OidcRoutesController {
  constructor(private readonly oidc: OidcProviderService) {}

  @All(['.well-known/openid-configuration', 'oauth/*'])
  handle(@Req() req: any, @Res() res: any) {
    return this.oidc.callback()(req, res);
  }
}
