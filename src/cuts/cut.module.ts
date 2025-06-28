import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cut } from './cut.entity';
import { CutsController } from './cut.controller';
import { CutsService } from './cut.service';
import { CutRepository } from './cut.repository';
import { Audit } from 'src/audits/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cut, Audit])], // Importás las entidades para que el repositorio funcione
  controllers: [CutsController],
  providers: [CutsService, CutRepository],
})
export class CutModule {}
