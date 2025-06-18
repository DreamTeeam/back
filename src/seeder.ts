import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RoleSeeder } from './modules/roles/role.seeder';
import { UserSeeder } from './modules/users/user.seeder';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);

  const roleSeeder = appContext.get(RoleSeeder);
  const userSeeder = appContext.get(UserSeeder);

  try {
    console.log('Seeding initial data...');

    await roleSeeder.seed();
    await userSeeder.seed();

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
