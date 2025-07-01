import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException // <--- IMPORTAR ForbiddenException
} from '@nestjs/common';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Employee } from './entities/employee.entity';
import { Client } from './entities/client.entity';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectTenantRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectTenantRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectTenantRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly dataSource: DataSource,
  ) {}

  async softDeleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['employee', 'employee.roles', 'client'],
    });

    if (!user) {
      // Mensaje actualizado a inglés
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }
    
    const isSuperAdmin = user.employee?.roles.some(
      (role) => role.name === 'SUPERADMIN',
    );

    if (isSuperAdmin) {
      // Mensaje actualizado a inglés
      throw new ForbiddenException('The SUPERADMIN user account cannot be deleted.');
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.softRemove(user);
      if (user.employee) {
        await transactionalEntityManager.softRemove(user.employee);
      }
      if (user.client) {
        await transactionalEntityManager.softRemove(user.client);
      }
    });
  }
  
  async findDeletedUsers(): Promise<User[]> {
    return this.userRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
      relations: ['employee', 'client', 'employee.roles'],
    });
  }

  async restoreUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['employee', 'client'],
    });

    if (!user) {
      // Mensaje actualizado a inglés
      throw new NotFoundException(`User with ID '${id}' not found among active or deleted records.`);
    }

    if (!user.deletedAt) {
      // Mensaje actualizado a inglés
      throw new BadRequestException(`The user with ID '${id}' is not in a locked state.`);
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.restore(User, user.id);
      if (user.employee) {
        await transactionalEntityManager.restore(Employee, user.employee.id);
      }
      if (user.client) {
        await transactionalEntityManager.restore(Client, user.client.id);
      }
    });
  }
}