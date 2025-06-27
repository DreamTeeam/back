// src/master_modules/users/users.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { UserTenant } from '../user-tenants/entities/user-tenant.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
  ) {}

  /**
   * Finds a user by their email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Finds a user by their global ID.
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Creates a new global user and links them to a tenant with a specific role.
   * This will be called by the AuthService during registration.
   */
  async create(
    dto: RegisterDto,
    tenantId: string,
    role: string,
  ): Promise<Omit <User, 'password'>> {
    // This logic will be fully implemented when we build AuthService
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create the global User entity
    const newUser = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(newUser);

    // Create the link to the tenant
    const newUserTenant = this.userTenantRepository.create({
      user: savedUser,
      tenant: { id: tenantId }, // Link by providing the ID object
      role: role,
    });
    await this.userTenantRepository.save(newUserTenant);

    // We don't need to return the password hash
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }
}
