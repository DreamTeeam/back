import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  BadRequestException, // Excepción usada para la nueva validación
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository, In } from 'typeorm';

import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { Employee } from '../users/entities/employee.entity';
import { Client } from '../users/entities/client.entity';
import { Role } from '../roles/entities/role.entity';
import { TenantConnectionService } from '../../common/tenant-connection/tenant-connection.service';
import { getTenantContext } from '../../common/context/tenant-context';
import { NotificationsService } from '../notifications/notifications.service'; //Steven
import { instanceToPlain } from 'class-transformer';



@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly notificationsService: NotificationsService, //Steven
  ) {}

  // --- 🔧 Métodos utilitarios para obtener repositorios dinámicos ---
  private getDataSource() {
    return this.tenantConnectionService.getTenantDataSourceFromContext();
  }

  private getUserRepository(): Repository<User> {
    return this.getDataSource().getRepository(User);
  }

  private getEmployeeRepository(): Repository<Employee> {
    return this.getDataSource().getRepository(Employee);
  }

  private getClientRepository(): Repository<Client> {
    return this.getDataSource().getRepository(Client);
  }

  // --- 🔐 Login ---
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

  // --- 📝 Registro ---
  async registerEmployee(
    registerEmployeeDto: RegisterEmployeeDto,
  ): Promise<User> {
    return this.registerUserWithRole(registerEmployeeDto, 'employee');
  }

  async registerClient(registerClientDto: RegisterClientDto): Promise<User> {
    return this.registerUserWithRole(registerClientDto, 'client');
  }

  // --- 🔐 Google Logins ---
  // ... (El resto de los métodos de Google Login permanecen sin cambios)
  async validateAndLoginGoogleEmployee(googleUser: {
    email: string;
  }): Promise<string> {
    const user = await this.getUserRepository().findOne({
      where: { email: googleUser.email },
      relations: { employee: { roles: true } },
    });

    if (!user || !user.employee) {
      throw new UnauthorizedException(
        'This Google account is not associated with a registered employee.',
      );
    }

     await this.notificationsService.notifyWelcome(user.employee, 'employee'); //Steven

    const payload = this.createJwtPayload(user);
    return this.jwtService.sign(payload);
  }

  async validateAndLoginOrCreateClient(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<string> {
    const dataSource = this.getDataSource();

    return dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const clientRepo = manager.getRepository(Client);

      let user = await userRepo.findOne({
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
        const password = await bcrypt.hash(Math.random().toString(36), 10);
        const newUser = userRepo.create({
          email: googleUser.email,
          first_name: googleUser.firstName,
          last_name: googleUser.lastName,
          password,
        });

        const newClient = clientRepo.create({ user: newUser });
        const savedClient = await clientRepo.save(newClient);
        user = savedClient.user;
      
        //Steven
      await this.notificationsService.notifyWelcome(
          savedClient,
          'client',
          manager,
        ); //Steven
      };

      if (!user)
        throw new InternalServerErrorException(
          'User could not be created or retrieved.',
        );

      const payload = this.createJwtPayload(user, 'CLIENT');
      return this.jwtService.sign(payload);
    });
  }

  // --- 🔒 Métodos privados ---
  // ... (validateUserPassword y createJwtPayload permanecen sin cambios)
  private async validateUserPassword(
    loginDto: LoginDto,
    userType: 'employee' | 'client',
  ): Promise<User> {
    const { email, password } = loginDto;

    const relations =
      userType === 'employee'
        ? { employee: { roles: true, user: true } } // STEVEN Y NACHO
        : { client: true };

    const user = await this.getUserRepository().findOne({
      where: { email },
      relations,
    });
    
 //agrego
 console.log('LOGIN DEBUG: usuario encontrado:', user);
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

     // 🔔 Notificación de login //Steven
    if (userType === 'employee') {
      await this.notificationsService.notifyLogin(user.employee, 'employee');
    } else {
      await this.notificationsService.notifyLogin(user.client, 'client');
    }

    return user;
  }

  private createJwtPayload(
    user: User,
    fixedRole?: 'CLIENT',
  ): {
    sub: string;
    email: string;
    name: string;
    roles: string[];
    customerId: string;
  } {
    const roles = fixedRole
      ? [fixedRole]
      : user.employee.roles.map((role) => role.name);

    const customerId = getTenantContext()?.customerId;
    if (!customerId) {
      throw new InternalServerErrorException(
        'No customerId in tenant context.',
      );
    }

    return {
      sub: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      roles,
      customerId,
    };
  }

  // ▼▼▼ MÉTODO MODIFICADO CON PROTECCIÓN DE ROLES ▼▼▼
  private async registerUserWithRole(
    dto: RegisterEmployeeDto | RegisterClientDto,
    role: 'employee' | 'client',
  ): Promise<User> {
    const dataSource = this.getDataSource();

    return dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const existingUser = await userRepo.findOneBy({ email: dto.email });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      
      let newUser: User;

      if (role === 'employee') {
        const employeeRepo = manager.getRepository(Employee);
        const { roles: roleIds, ...userDto } = dto as RegisterEmployeeDto;

        newUser = userRepo.create({ ...userDto, password: hashedPassword });

        let rolesToAssign: Role[] = [];

        if (roleIds && roleIds.length > 0) {
          const roleRepo = manager.getRepository(Role);
          const existingRoles = await roleRepo.findBy({ id: In(roleIds) });
          
          if (existingRoles.length !== roleIds.length) {
            throw new BadRequestException('One or more roles are invalid');
          }

          // <--- NUEVA VALIDACIÓN AÑADIDA ---
          // Comprueba si alguno de los roles solicitados es un rol protegido.
          const forbiddenRoles = ['ADMIN', 'SUPERADMIN'];
          const hasForbiddenRole = existingRoles.some(role => 
            forbiddenRoles.includes(role.name.toUpperCase())
          );

          if (hasForbiddenRole) {
            throw new BadRequestException('Assigning ADMIN or SUPERADMIN roles is not permitted.');
          }
          // <--- FIN DE LA NUEVA VALIDACIÓN ---

          rolesToAssign = existingRoles;
        }
        
        const newEmployee = employeeRepo.create({ 
          user: newUser,
          roles: rolesToAssign 
        });
        
            const savedEmployee = await employeeRepo.save(newEmployee);

        await this.notificationsService.notifyWelcome(
          savedEmployee,
          'employee',
          manager,
        ); //Steven

        return savedEmployee.user;

        

      } else {
        const clientRepo = manager.getRepository(Client);
        newUser = userRepo.create({ ...dto, password: hashedPassword });

        const newClient = clientRepo.create({ user: newUser });
        const savedClient = await clientRepo.save(newClient);

        await this.notificationsService.notifyWelcome(
          savedClient,
          'client',
          manager,
        ); //Steven

      return newUser;
    }
    });
  }
}























// import {
//   Injectable,
//   ConflictException,
//   UnauthorizedException,
//   InternalServerErrorException,
//   Logger,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';
// import { Repository } from 'typeorm';

// import { RegisterEmployeeDto } from './dto/register-employee.dto';
// import { RegisterClientDto } from './dto/register-client.dto';
// import { LoginDto } from './dto/login.dto';
// import { User } from '../users/entities/user.entity';
// import { Employee } from '../users/entities/employee.entity';
// import { Client } from '../users/entities/client.entity';
// import { TenantConnectionService } from '../../common/tenant-connection/tenant-connection.service';
// import { getTenantContext } from '../../common/context/tenant-context';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly tenantConnectionService: TenantConnectionService,
//   ) {}

//   // --- 🔧 Métodos utilitarios para obtener repositorios dinámicos ---
//   private getDataSource() {
//     return this.tenantConnectionService.getTenantDataSourceFromContext();
//   }

//   private getUserRepository(): Repository<User> {
//     return this.getDataSource().getRepository(User);
//   }

//   private getEmployeeRepository(): Repository<Employee> {
//     return this.getDataSource().getRepository(Employee);
//   }

//   private getClientRepository(): Repository<Client> {
//     return this.getDataSource().getRepository(Client);
//   }

//   // --- 🔐 Login ---
//   async employeeLogin(loginDto: LoginDto): Promise<string> {
//     const user = await this.validateUserPassword(loginDto, 'employee');
//     const payload = this.createJwtPayload(user);
//     return this.jwtService.sign(payload);
//   }

//   async clientLogin(loginDto: LoginDto): Promise<string> {
//     const user = await this.validateUserPassword(loginDto, 'client');
//     const payload = this.createJwtPayload(user, 'CLIENT');
//     return this.jwtService.sign(payload);
//   }

//   // --- 📝 Registro ---
//   async registerEmployee(
//     registerEmployeeDto: RegisterEmployeeDto,
//   ): Promise<User> {
//     return this.registerUserWithRole(registerEmployeeDto, 'employee');
//   }

//   async registerClient(registerClientDto: RegisterClientDto): Promise<User> {
//     return this.registerUserWithRole(registerClientDto, 'client');
//   }

//   // --- 🔐 Google Logins ---
//   async validateAndLoginGoogleEmployee(googleUser: {
//     email: string;
//   }): Promise<string> {
//     const user = await this.getUserRepository().findOne({
//       where: { email: googleUser.email },
//       relations: { employee: { roles: true } },
//     });

//     if (!user || !user.employee) {
//       throw new UnauthorizedException(
//         'This Google account is not associated with a registered employee.',
//       );
//     }

//     const payload = this.createJwtPayload(user);
//     return this.jwtService.sign(payload);
//   }

//   async validateAndLoginOrCreateClient(googleUser: {
//     email: string;
//     firstName: string;
//     lastName: string;
//   }): Promise<string> {
//     const dataSource = this.getDataSource();

//     return dataSource.transaction(async (manager) => {
//       const userRepo = manager.getRepository(User);
//       const clientRepo = manager.getRepository(Client);

//       let user = await userRepo.findOne({
//         where: { email: googleUser.email },
//         relations: { client: true },
//       });

//       if (user && !user.client) {
//         throw new UnauthorizedException(
//           'An account with this email already exists but is not a client account.',
//         );
//       }

//       if (!user) {
//         this.logger.log(
//           `User not found for ${googleUser.email}. Creating new client user.`,
//         );
//         const password = await bcrypt.hash(Math.random().toString(36), 10);
//         const newUser = userRepo.create({
//           email: googleUser.email,
//           first_name: googleUser.firstName,
//           last_name: googleUser.lastName,
//           password,
//         });

//         const newClient = clientRepo.create({ user: newUser });
//         const savedClient = await clientRepo.save(newClient);
//         user = savedClient.user;
//       }

//       if (!user)
//         throw new InternalServerErrorException(
//           'User could not be created or retrieved.',
//         );

//       const payload = this.createJwtPayload(user, 'CLIENT');
//       return this.jwtService.sign(payload);
//     });
//   }

//   // --- 🔒 Métodos privados ---

//   private async validateUserPassword(
//     loginDto: LoginDto,
//     userType: 'employee' | 'client',
//   ): Promise<User> {
//     const { email, password } = loginDto;

//     const relations =
//       userType === 'employee'
//         ? { employee: { roles: true } }
//         : { client: true };

//     const user = await this.getUserRepository().findOne({
//       where: { email },
//       relations,
//     });

//     if (
//       !user ||
//       (userType === 'employee' && !user.employee) ||
//       (userType === 'client' && !user.client)
//     ) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const isPasswordMatching = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatching) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     return user;
//   }

//   private createJwtPayload(
//     user: User,
//     fixedRole?: 'CLIENT',
//   ): {
//     sub: string;
//     email: string;
//     name: string;
//     roles: string[];
//     customerId: string;
//   } {
//     const roles = fixedRole
//       ? [fixedRole]
//       : user.employee.roles.map((role) => role.name);

//     const customerId = getTenantContext()?.customerId;
//     if (!customerId) {
//       throw new InternalServerErrorException(
//         'No customerId in tenant context.',
//       );
//     }

//     return {
//       sub: user.id,
//       email: user.email,
//       name: `${user.first_name} ${user.last_name}`,
//       roles,
//       customerId, // 💡 Muy importante para middleware en próximas peticiones
//     };
//   }

//   private async registerUserWithRole(
//     dto: RegisterEmployeeDto | RegisterClientDto,
//     role: 'employee' | 'client',
//   ): Promise<User> {
//     const dataSource = this.getDataSource();

//     return dataSource.transaction(async (manager) => {
//       const userRepo = manager.getRepository(User);
//       const existingUser = await userRepo.findOneBy({ email: dto.email });

//       if (existingUser) {
//         throw new ConflictException('Email already registered');
//       }

//       const hashedPassword = await bcrypt.hash(dto.password, 10);
//       const newUser = userRepo.create({ ...dto, password: hashedPassword });

//       if (role === 'employee') {
//         const employeeRepo = manager.getRepository(Employee);
//         const newEmployee = employeeRepo.create({ user: newUser });
//         await employeeRepo.save(newEmployee);
//       } else {
//         const clientRepo = manager.getRepository(Client);
//         const newClient = clientRepo.create({ user: newUser });
//         await clientRepo.save(newClient);
//       }

//       return newUser;
//     });
//   }
// }










// import {
//   Injectable,
//   ConflictException,
//   UnauthorizedException,
//   InternalServerErrorException,
//   Logger,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { DataSource, EntityManager, Repository } from 'typeorm';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';

// import { RegisterEmployeeDto } from './dto/register-employee.dto';
// import { RegisterClientDto } from './dto/register-client.dto';
// import { LoginDto } from './dto/login.dto';
// import { User } from '../users/entities/user.entity';
// import { Employee } from '../users/entities/employee.entity';
// import { Client } from '../users/entities/client.entity';
// import { Role } from '../roles/entities/role.entity';
// import { stringify } from 'querystring';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     @InjectRepository(Employee)
//     private readonly employeeRepository: Repository<Employee>,
//     @InjectRepository(Client)
//     private readonly clientRepository: Repository<Client>,
//     private readonly dataSource: DataSource,
//     private readonly jwtService: JwtService,
//   ) {}

//   //& --- LÓGICAS PÚBLICAS ---

//   // #region Logins
//   async employeeLogin(loginDto: LoginDto): Promise<string> {
//     const user = await this.validateUserPassword(loginDto, 'employee');
//     const payload = this.createJwtPayload(user);
//     return this.jwtService.sign(payload);
//   }

//   async clientLogin(loginDto: LoginDto): Promise<string> {
//     const user = await this.validateUserPassword(loginDto, 'client');
//     const payload = this.createJwtPayload(user, 'CLIENT');
//     return this.jwtService.sign(payload);
//   }
//   // #endregion

//   // #region Registrations
//   async registerEmployee(
//     registerEmployeeDto: RegisterEmployeeDto,
//   ): Promise<User> {
//     return this.registerUserWithRole(registerEmployeeDto, 'employee');
//   }

//   async registerClient(registerClientDto: RegisterClientDto): Promise<User> {
//     return this.registerUserWithRole(registerClientDto, 'client');
//   }
//   // #endregion

//   // #region Google Logins
//   async validateAndLoginGoogleEmployee(googleUser: {
//     email: string;
//   }): Promise<string> {
//     const user = await this.userRepository.findOne({
//       where: { email: googleUser.email },
//       relations: { employee: { roles: true } },
//     });

//     if (!user || !user.employee) {
//       throw new UnauthorizedException(
//         'This Google account is not associated with a registered employee.',
//       );
//     }

//     const payload = this.createJwtPayload(user);
//     return this.jwtService.sign(payload);
//   }

//   async validateAndLoginOrCreateClient(googleUser: {
//     email: string;
//     firstName: string;
//     lastName: string;
//   }): Promise<string> {
//     return this.dataSource.transaction(async (manager) => {
//       let user = await manager.findOne(User, {
//         where: { email: googleUser.email },
//         relations: { client: true },
//       });

//       if (user && !user.client) {
//         throw new UnauthorizedException(
//           'An account with this email already exists but is not a client account.',
//         );
//       }

//       if (!user) {
//         this.logger.log(
//           `User not found for ${googleUser.email}. Creating new client user.`,
//         );
//         const userRepo = manager.getRepository(User);
//         const clientRepo = manager.getRepository(Client);

//         const password = await bcrypt.hash(Math.random().toString(36), 10);
//         const newUserEntity = userRepo.create({
//           email: googleUser.email,
//           first_name: googleUser.firstName,
//           last_name: googleUser.lastName,
//           password: password,
//         });

//         // CORRECCIÓN: Se crea el cliente, se le asigna el usuario y se guarda. Cascade se encarga del resto.
//         const newClient = clientRepo.create({ user: newUserEntity });
//         const savedClient = await clientRepo.save(newClient);

//         // Asignamos el usuario recién creado (con su ID) para generar el token.
//         user = savedClient.user;
//       }

//       if (!user)
//         throw new InternalServerErrorException(
//           'User could not be created or retrieved.',
//         );

//       const payload = this.createJwtPayload(user, 'CLIENT');
//       return this.jwtService.sign(payload);
//     });
//   }
//   // #endregion

//   // --- MÉTODOS PRIVADOS REFACTORIZADOS ---

//   private async validateUserPassword(
//     loginDto: LoginDto,
//     userType: 'employee' | 'client',
//   ): Promise<User> {
//     const { email, password } = loginDto;

//     const relations =
//       userType === 'employee'
//         ? { employee: { roles: true } }
//         : { client: true };

//     const user = await this.userRepository.findOne({
//       where: { email },
//       relations,
//     });

//     if (
//       !user ||
//       (userType === 'employee' && !user.employee) ||
//       (userType === 'client' && !user.client)
//     ) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const isPasswordMatching = await bcrypt.compare(password, user.password);
//     if (!isPasswordMatching) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     return user;
//   }

//   private createJwtPayload(
//     user: User,
//     fixedRole?: 'CLIENT',
//   ): { sub: string; email: string; name: string; roles: string[] } {
//     const roles = fixedRole
//       ? [fixedRole]
//       : user.employee.roles.map((role) => role.name);
//     return {
//       sub: user.id,
//       email: user.email,
//       name: `${user.first_name} ${user.last_name}`,
//       roles,
//     };
//   }

//   private async registerUserWithRole(
//     dto: RegisterEmployeeDto | RegisterClientDto,
//     role: 'employee' | 'client',
//   ): Promise<User> {
//     return this.dataSource.transaction(async (manager) => {
//       const userRepo = manager.getRepository(User);
//       const existingUser = await userRepo.findOneBy({ email: dto.email });

//       if (existingUser) {
//         throw new ConflictException('Email already registered');
//       }

//       const hashedPassword = await bcrypt.hash(dto.password, 10);
//       const newUser = userRepo.create({
//         ...dto,
//         password: hashedPassword,
//       });

//       if (role === 'employee') {
//         const employeeRepo = manager.getRepository(Employee);
//         const newEmployee = employeeRepo.create({ user: newUser });
//         await employeeRepo.save(newEmployee);
//       } else {
//         const clientRepo = manager.getRepository(Client);
//         const newClient = clientRepo.create({ user: newUser });
//         await clientRepo.save(newClient);
//       }

//       return newUser;
//     });
//   }
// }