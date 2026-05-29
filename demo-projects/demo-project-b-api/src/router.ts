import { Router } from 'express';

type ResourceHandler = (req: any, res: any, next?: any) => unknown;
type ResourceMethod = { middleware?: ResourceHandler[]; handler: ResourceHandler };
type Resource = Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', ResourceMethod>>;

export function bindResource(router: Router, routePath: string, resource: Resource) {
  for (const method of Object.keys(resource) as Array<keyof Resource>) {
    const route = resource[method];
    if (!route) continue;
    const middleware = route.middleware ?? [];
    (router as any)[method](routePath, ...middleware, async (req: any, res: any, next: any) => {
      try {
        await route.handler(req, res, next);
      } catch (error) {
        next(error);
      }
    });
  }
}
