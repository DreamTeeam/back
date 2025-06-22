import { AsyncLocalStorage } from 'async_hooks';
import { DataSource } from 'typeorm';

/*
  & Interfaz que define la estructura del contexto del tenant.
  & Contiene el ID de la zapatería y la instancia de la conexión a su base de datos.
 */
interface TenantContextStore {
  customerId: string; //% id de la zapatería
  tenantDataSource: DataSource; //% cadena de conexión a su DB
  //XXX En caso de que nacho los requiera se pueden añadir el nombre de la zapatería, nivel de suscripción etc
}

//& Crea una instancia de AsyncLocalStorage para almacenar el contexto del tenant
export const tenantContext = new AsyncLocalStorage<TenantContextStore>();

/*
  & Obtiene el contexto del tenant de la AsyncLocalStorage actual.
  & @returns El contexto del tenant si está disponible, de lo contrario, undefined.
 */
export function getTenantContext(): TenantContextStore | undefined {
  return tenantContext.getStore();
}

/*
  & Ejecuta una función dentro de un contexto de tenant específico.
  & @param context El contexto del tenant a establecer para la ejecución de la función.
  & @param fn La función a ejecutar dentro del contexto.
  & @param args Argumentos opcionales para la función.
  & @returns El resultado de la función.
 */
export function runInTenantContext<T>(
  context: TenantContextStore,
  fn: (...args: any[]) => T,
  ...args: any[]
): T {
  return tenantContext.run(context, fn, ...args);
}
