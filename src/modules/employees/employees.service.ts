import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Employee } from '../users/entities/employee.entity';
import { Role } from '../roles/entities/role.entity';
import { UpdateEmployeeRolesDto } from './dto/update-employee-roles.dto';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectTenantRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectTenantRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async updateEmployeeRoles(id: string, updateDto: UpdateEmployeeRolesDto) {
    const { roleIds } = updateDto;

    const employeeToUpdate = await this.employeeRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!employeeToUpdate) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    const isTargetSuperAdmin = employeeToUpdate.roles.some(
      (role) => role.name === 'SUPERADMIN',
    );
    
    if (isTargetSuperAdmin) {
      throw new ForbiddenException(
        'The roles of a SUPERADMIN cannot be modified',
      );
    }

    const rolesToAssign = await this.roleRepository.findBy({ id: In(roleIds) });
    if (rolesToAssign.length !== roleIds.length) {
      throw new BadRequestException(
        'One or more provided role IDs are invalid',
      );
    }

    const isAssigningSuperAdmin = rolesToAssign.some(
      (role) => role.name === 'SUPERADMIN',
    );
    if (isAssigningSuperAdmin) {
      throw new ForbiddenException(
        'The SUPERADMIN role cannot be assigned by an ADMIN',
      );
    }

    employeeToUpdate.roles = rolesToAssign;
    return this.employeeRepository.save(employeeToUpdate);
  }

async findAllForTenant(): Promise<any[]> {
    const employees = await this.employeeRepository.find({
      select: {
        user: { id: true, email: true, first_name: true, last_name: true },
        roles: { name: true },
      },
      relations: {
        user: true,
        roles: true,
      },
    });

    return employees.map((employee) => ({
      userId: employee.user.id,
      email: employee.user.email,
      name: `${employee.user.first_name} ${employee.user.last_name}`.trim(),
      roles: employee.roles.map((role) => role.name),
    }));
  }
}