import {
  Injectable,
  CallHandler,
  ExecutionContext,
  Inject,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUTO_AUDIT_KEY } from '../decorator/audit-log.decorator';

@Injectable()
export class AutoAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    @Inject('ENTITY_SERVICES')
    private readonly entityServices: Record<string, any>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isAuditable = this.reflector.get<boolean>(
      AUTO_AUDIT_KEY,
      context.getHandler(),
    );
    if (!isAuditable) return next.handle();

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const body = request.body;
    const params = request.params;
    const user = request.user;

    const route = request.route.path; // Ej: /products/:id
    const baseSegment = route.split('/')[1]?.replace(/s$/, ''); // 'product'
    const entityName =
      baseSegment.charAt(0).toUpperCase() + baseSegment.slice(1); // 'Product'
    const idField = 'id';
    const entityId = params[idField];
    const serviceName = `${baseSegment}Service`; // 'productService'
    const entityService = this.entityServices[serviceName];

    let oldEntity = null;
    if ((method === 'PUT' || method === 'DELETE') && entityService?.findOne) {
      oldEntity = await entityService.findOne(entityId);
    }

    return next.handle().pipe(
      tap(async (response) => {
        const employeeId =
          user?.id ||
          user?.employeeId ||
          '11111111-1111-1111-1111-111111111111';

        if (method === 'PUT') {
          await this.auditService.auditUpdate({
            oldEntity,
            newData: body,
            entityId,
            entityName,
            employeeId,
          });
        }

        if (method === 'DELETE') {
          await this.auditService.auditDelete({
            oldEntity,
            entityId,
            entityName,
            employeeId,
          });
        }

        if (method === 'POST') {
          const createdId = response?.id || response?.[idField];
          if (createdId) {
            await this.auditService.auditCreate({
              data: body,
              entityId: createdId,
              entityName,
              employeeId,
            });
          }
        }
      }),
    );
  }
}
