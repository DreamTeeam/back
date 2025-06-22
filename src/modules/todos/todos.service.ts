//! IMPORTANT
//TODO ESTOS CAMBIOS SON MASIVOS; ES DECIR DEBERÁN IR MÓDULO POR MÓDULO Y SERVICIO POR SERVICIO
//& ELIMINNDO(COMENTAR) @InjectRepository Y REMPLAZANDOLO POR LA LÓGICA DE get[Entity]Repository().

import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm'; //! COMENTAR, NO ELIMINAR HASTA HACEGURARSE QUE TODOS LOS ENDPOINTS FUNCIONAN
import { Repository, DataSource } from 'typeorm'; //! IMPORTANTE, IMPORTAR DATASOURCE Y REPOSITORY
import { Todo } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TenantConnectionService } from '../../common/tenant-connection/tenant-connection.service'; //! IMPORTAR TenantConnectionService


@Injectable()
export class TodosService {
  constructor(
    // @InjectRepository(Todo)private readonly todoRepository: Repository<Todo>, //! YA NO SE INYECTARÁ DIRECTAMENTE
    private readonly tenantConnectionService: TenantConnectionService, //! EN SU LUGAR SE INYECTARÁ EL SERVICIO DE CONEXIÓN
  ) {}

  //TODO AGREGAR MÉTODO PARA OBTENER EL REPOSITORIO DEL TENANT ACTUAL
  private getTodoRepository(): Repository<Todo> {
    const dataSource =
      this.tenantConnectionService.getTenantDataSourceFromContext();
    return dataSource.getRepository(Todo);
  }

  async findAll(): Promise<Todo[]> {
    const todoRepository = this.getTodoRepository(); //! LLAMAR AL MÉTODO PARA OBTENER EL REPO DE LA CONEXIÓN DEL TENANT
    // return this.todoRepository.find(); //! ELIMINAR EL CONTEXTO DEL REPO(this)
    return todoRepository.find();
  }

  async findOne(id: string): Promise<Todo> {
    const todoRepository = this.getTodoRepository(); //! LLAMAR AL MÉTODO PARA OBTENER EL REPO DE LA CONEXIÓN DEL TENANT
    // const todo = await this.todoRepository.findOne({ where: { id } });//! ELIMINAR EL CONTEXTO DEL REPO(this)
    const todo = await todoRepository.findOne({ where: { id } });
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todoRepository = this.getTodoRepository(); //! LLAMAR AL MÉTODO PARA OBTENER EL REPO DE LA CONEXIÓN DEL TENANT
    // const todo = this.todoRepository.create({//! ELIMINAR EL CONTEXTO DEL REPO(this)
    const todo = todoRepository.create({
      ...createTodoDto,
      completed: createTodoDto.completed ?? false,
    });
    // return this.todoRepository.save(todo);
    return todoRepository.save(todo);
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const todoRepository = this.getTodoRepository(); //! LLAMAR AL MÉTODO PARA OBTENER EL REPO DE LA CONEXIÓN DEL TENANT
    const todo = await this.findOne(id); //? ESTE THIS ES PARA REUTILIZAR LA FUNCIÓN findOne (LINEA 34)
    const updated = Object.assign(todo, updateTodoDto);
    // return this.todoRepository.save(updated);//! ELIMINAR EL CONTEXTO DEL REPO(this)
    return todoRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const todoRepository = this.getTodoRepository(); //! LLAMAR AL MÉTODO PARA OBTENER EL REPO DE LA CONEXIÓN DEL TENANT
    // const result = await this.todoRepository.delete(id);//! ELIMINAR EL CONTEXTO DEL REPO(this)
    const result = await this.findOne(id); //? ESTE THIS ES PARA REUTILIZAR LA FUNCIÓN findOne (LINEA 34)
    await todoRepository.softDelete(id);
  }
}
