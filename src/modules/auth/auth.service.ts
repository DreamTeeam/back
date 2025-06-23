import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { Employee } from '../users/entities/employee.entity';
import { Client } from '../users/entities/client.entity';
import { Role } from '../roles/entities/role.entity';
import { stringify } from 'querystring';
import { In } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  //& --- LÓGICAS PÚBLICAS ---

  // #region Logins
  async employeeLogin(loginDto: LoginDto): Promise<string> {
    const user = await this.validateUserPassword(loginDto, 'employee');
    const payload = this.createJwtPayload(user);
    return this.jwtService.sign(payload);
  }

  async clientLogin(loginDto: LoginDto): Promise<string> {
    const user = await this.validateUserPassword(loginDto, 'client');
    const payload = this.createJwtPayload(user, 'CLIENT');
    return this.jwtService.sign(payload);
  }
  // #endregion

  // #region Registrations
  async registerEmployee(
    registerEmployeeDto: RegisterEmployeeDto,
  ): Promise<User> {
    const { roles: roleIds, ...userDto } = registerEmployeeDto; // Separa los IDs de los roles del resto del DTO

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);
      const employeeRepo = manager.getRepository(Employee);

      // 1. Verificar si el email ya existe
      const existingUser = await userRepo.findOneBy({ email: userDto.email });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // 2. Verificar que todos los roles proporcionados existan
      const existingRoles = await roleRepo.findBy({ id: In(roleIds) });
      if (existingRoles.length !== roleIds.length) {
        throw new BadRequestException('One or more roles are invalid');
      }

      // 3. Crear y guardar la entidad User
      const hashedPassword = await bcrypt.hash(userDto.password, 10);
      const newUser = userRepo.create({
        ...userDto,
        password: hashedPassword,
      });

      // 4. Crear la entidad Employee, asignando el nuevo usuario y los roles encontrados
      // Gracias al @JoinTable en la entidad Employee, TypeORM manejará la tabla pivote employee_roles
      const newEmployee = employeeRepo.create({
        user: newUser, // Asigna el objeto User completo
        roles: existingRoles, // Asigna el arreglo de entidades Role encontradas
      });

      // 5. Guardar el empleado. Gracias a `cascade: true` en la relación, el usuario se guardará automáticamente.
      await employeeRepo.save(newEmployee);

      // La contraseña ya está excluida por el decorador @Exclude() en la entidad User
      return newUser;
    });
  }

  async registerClient(registerClientDto: RegisterClientDto): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const clientRepo = manager.getRepository(Client);

      // Verificar si el email ya existe
      const existingUser = await userRepo.findOneBy({
        email: registerClientDto.email,
      });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Crear y guardar la entidad User
      const hashedPassword = await bcrypt.hash(registerClientDto.password, 10);
      const newUser = userRepo.create({
        ...registerClientDto,
        password: hashedPassword,
      });
      
      // Crear y guardar la entidad Client
      const newClient = clientRepo.create({ user: newUser });
      await clientRepo.save(newClient);

      return newUser;
    });
  }
  // #endregion

  // #region Google Logins
  async validateAndLoginGoogleEmployee(googleUser: {
    email: string;
  }): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email: googleUser.email },
      relations: { employee: { roles: true } },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedException(
        'This Google account is not associated with a registered employee.',
      );
    }

    const payload = this.createJwtPayload(user);
    return this.jwtService.sign(payload);
  }

  async validateAndLoginOrCreateClient(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      let user = await manager.findOne(User, {
        where: { email: googleUser.email },
        relations: { client: true },
      });

      if (user && !user.client) {
        throw new UnauthorizedException(
          'An account with this email already exists but is not a client account.',
        );
      }

      if (!user) {
        this.logger.log(
          `User not found for ${googleUser.email}. Creating new client user.`,
        );
        const userRepo = manager.getRepository(User);
        const clientRepo = manager.getRepository(Client);

        const password = await bcrypt.hash(Math.random().toString(36), 10);
        const newUserEntity = userRepo.create({
          email: googleUser.email,
          first_name: googleUser.firstName,
          last_name: googleUser.lastName,
          password: password,
        });

        // CORRECCIÓN: Se crea el cliente, se le asigna el usuario y se guarda. Cascade se encarga del resto.
        const newClient = clientRepo.create({ user: newUserEntity });
        const savedClient = await clientRepo.save(newClient);

        // Asignamos el usuario recién creado (con su ID) para generar el token.
        user = savedClient.user;
      }

      if (!user)
        throw new InternalServerErrorException(
          'User could not be created or retrieved.',
        );

      const payload = this.createJwtPayload(user, 'CLIENT');
      return this.jwtService.sign(payload);
    });
  }
  // #endregion

  // --- MÉTODOS PRIVADOS REFACTORIZADOS ---

  private async validateUserPassword(
    loginDto: LoginDto,
    userType: 'employee' | 'client',
  ): Promise<User> {
    const { email, password } = loginDto;

    const relations =
      userType === 'employee'
        ? { employee: { roles: true } }
        : { client: true };

    const user = await this.userRepository.findOne({
      where: { email },
      relations,
    });

    if (
      !user ||
      (userType === 'employee' && !user.employee) ||
      (userType === 'client' && !user.client)
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private createJwtPayload(
    user: User,
    fixedRole?: 'CLIENT',
  ): { sub: string; email: string; name: string; roles: string[] } {
    const roles = fixedRole
      ? [fixedRole]
      : user.employee.roles.map((role) => role.name);
    return {
      sub: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      roles,
    };
  }

  private async registerUserWithRole(
    dto: RegisterEmployeeDto | RegisterClientDto,
    role: 'employee' | 'client',
  ): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const existingUser = await userRepo.findOneBy({ email: dto.email });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const newUser = userRepo.create({
        ...dto,
        password: hashedPassword,
      });

      if (role === 'employee') {
        const employeeRepo = manager.getRepository(Employee);
        const newEmployee = employeeRepo.create({ user: newUser });
        await employeeRepo.save(newEmployee);
      } else {
        const clientRepo = manager.getRepository(Client);
        const newClient = clientRepo.create({ user: newUser });
        await clientRepo.save(newClient);
      }

      return newUser;
    });
  }
}
