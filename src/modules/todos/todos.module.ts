//! IMPORTANT
//TODO ESTOS CAMBIOS SON MASIVOS; ES DECIR DEBERÁN IR MÓDULO POR MÓDULO Y SERVICIO POR SERVICIO
//& ELIMINNDO(COMENTAR) @InjectRepository Y REMPLAZANDOLO POR LA LÓGICA DE get[Entity]Repository().

import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; //! COMENTAR, NO ELIMINAR HASTA HACEGURARSE QUE TODOS LOS ENDPOINTS FUNCIONAN
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { Todo } from './entities/todo.entity';

//! IMPORTA EL MÓDULO DE REPOSITORIOS DE TENANT
import { TenantTypeOrmModule } from '../../common/typeorm-tenant-repository/tenant-repository.provider';


@Module({
  //! Deberán remplazar TypeOrmModule.forFeature con TenantTypeOrmModule.forFeature
  //! asegurense de listar todas las entidades gestionadas por este módulo
  imports: [TenantTypeOrmModule.forFeature([Todo])],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
