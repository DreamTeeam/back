import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Employee } from './entities/employee.entity';
import { Role } from '../roles/entities/role.entity';
import { InjectTenantRepository } from 'src/common/typeorm-tenant-repository/tenant-repository.decorator';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectTenantRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed() {
    const initialUsers = [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: this.configService.get<string>('SUPERADMIN_EMAIL'),
        password: this.configService.get<string>('SUPERADMIN_PASSWORD'),
        roleName: 'SUPERADMIN',
      },
      {
        firstName: 'Admin',
        lastName: 'Owner',
        email: this.configService.get<string>('ADMIN_EMAIL'),
        password: this.configService.get<string>('ADMIN_PASSWORD'),
        roleName: 'ADMIN',
      },
    ];

    await this.dataSource.transaction(async (manager) => {
      for (const userData of initialUsers) {
        const userRepo = manager.getRepository(User);
        const employeeRepo = manager.getRepository(Employee);

        const existingUser = await userRepo.findOneBy({
          email: userData.email,
        });
        if (existingUser) {
          this.logger.log(`User ${userData.email} already exists. Skipping.`);
          continue;
        }

        const role = await this.roleRepository.findOneBy({
          name: userData.roleName,
        });
        if (!role) {
          this.logger.error(
            `Role ${userData.roleName} not found. Please run role seeder first.`,
          );
          continue;
        }

        const plainPassword = userData.password ?? 'SuperAdmin1!';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const newUser = userRepo.create({
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          password: hashedPassword,
        });


        const newEmployee = employeeRepo.create({
          user: newUser,
          roles: [role],
        });

        await employeeRepo.save(newEmployee);
        this.logger.log(
          `User ${userData.email} with role ${userData.roleName} created successfully.`,
        );
      }
    });
  }
}
