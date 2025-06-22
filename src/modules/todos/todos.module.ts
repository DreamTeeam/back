//! IMPORTANT
//TODO ESTOS CAMBIOS SON MASIVOS; ES DECIR DEBERÁN IR MÓDULO POR MÓDULO Y SERVICIO POR SERVICIO
//& ELIMINNDO(COMENTAR) @InjectRepository Y REMPLAZANDOLO POR LA LÓGICA DE get[Entity]Repository().

import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; //! COMENTAR, NO ELIMINAR HASTA HACEGURARSE QUE TODOS LOS ENDPOINTS FUNCIONAN
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { Todo } from './entities/todo.entity';

@Module({
  //! AUNQUE YA NO OCUPAREMOS TypeOrmModule.forFeature DEBIDO A QUE EL REPOSITORIO SE OBTENDRA DINAMICAMENTE
  // imports: [TypeOrmModule.forFeature([Todo])], //! COMENTAR, NO ELIMINAR HASTA HACEGURARSE QUE TODOS LOS ENDPOINTS FUNCIONAN
  imports: [],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
