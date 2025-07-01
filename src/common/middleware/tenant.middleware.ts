import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantConnectionService } from '../tenant-connection/tenant-connection.service';
import { runInTenantContext } from '../context/tenant-context';
import { CustomerService } from '../../master_data/customer/customer.service'; //! Para obtener la dbConnectionString

//FIXME Opciones de como obtener el tenantId. Ejemplos:
//? - Desde un subdominio: req.subdomains[0]
//? - Desde una cabecera personalizada: req.headers['x-tenant-id']
//? - Desde el usuario autenticado (más seguro): req.user.customerId (después del guard JWT)

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly customerService: CustomerService, //! Para buscar el cliente por slug/ID
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // --- ESTRATEGIA DE IDENTIFICACIÓN DEL TENANT ---
    // Aquí es donde defines cómo identificas a la zapatería.
    // Opciones:
    // 1. Desde el subdominio (ej: "zapateriaA.mipos.com" -> tenantId es "zapateriaA")
    //    let tenantIdentifier = req.subdomains[0];
    //    if (!tenantIdentifier) {
    //      throw new ForbiddenException('Tenant identifier not found in subdomain.');
    //    }
    // 2. Desde una cabecera HTTP personalizada (ej: X-Tenant-Id)

    //? EBGUENY esta modificacion la hizo flor :)
    // V-- LA MODIFICACIÓN VA JUSTO AQUÍ, AL INICIO DE LA FUNCIÓN --V  //! esto lo agregue yo FLOR
    // Si la solicitud es un preflight de CORS, la pasamos directamente sin procesar.
    // if (req.method === 'OPTIONS') {
    //   return next();
    // }
    // ^-- FIN DE LA MODIFICACIÓN --^

    let tenantIdentifier = req.headers['x-tenant-id'] as string;
    // 3. Desde el usuario autenticado (requiere que el guard de auth se ejecute ANTES)
    //    Si ya tienes un guard JWT que pone `user` en `req.user`, puedes hacer:
    //    const user = (req as any).user;
    //    if (!user || !user.customerId) { // Asumiendo que el JWT contiene customerId
    //      throw new UnauthorizedException('Customer ID not found in authenticated user token.');
    //    }
    //    let tenantIdentifier = user.customerId;

    if (!tenantIdentifier) {
      this.logger.warn(
        'No tenant identifier found. Request might be for global resources or unauthenticated.',
      );
      // Para rutas que no requieren tenant (ej. login inicial, registro de nuevas zapaterías)
      // simplemente llamas a next() sin establecer el contexto.
      // De lo contrario, puedes lanzar un error si todas las rutas deben tener un tenant.
      return next();
    }

    let customerId: string;
    try {
      // Asumiendo que tenantIdentifier es el SLUG de la compañía para una URL amigable
      const customer =
        await this.customerService.findOneBySlug(tenantIdentifier); // Método para buscar por slug
      customerId = customer.id;
      // O si tenantIdentifier ya es el UUID del customerId:
      // customerId = tenantIdentifier;

      // Comprueba el estado de la suscripción de la compañía
      // Opcional: Esto lo puedes hacer aquí o en un guard de autorización después.
      // const activeSubscription = await this.companySubscriptionService.findActiveSubscriptionForCustomer(customerId);
      // if (!activeSubscription || activeSubscription.status !== 'active') {
      //   throw new ForbiddenException('Company subscription is not active.');
      // }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException(
          `Tenant "${tenantIdentifier}" not found or not active.`,
        );
      }
      this.logger.error(
        `Error resolving tenant identifier "${tenantIdentifier}": ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error resolving tenant context.');
    }

    try {
      // 1. Obtener/crear el DataSource para este tenant
      const tenantDataSource =
        await this.tenantConnectionService.getTenantDataSource(customerId);

      // 2. Ejecutar la solicitud dentro del contexto del tenant
      // Esto hace que tenantDataSource esté disponible globalmente para esta solicitud
      // a través de getTenantContext()
      runInTenantContext(
        {
          customerId: customerId,
          tenantDataSource: tenantDataSource,
        },
        next,
      );
    } catch (error) {
      this.logger.error(
        `Failed to establish tenant context for ${customerId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not establish tenant context.',
      );
    }
  }
}
