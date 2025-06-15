import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cut } from 'src/cuts/cut.entity';
import { Audit } from 'src/audits/audit.entity';
import { CutService } from 'src/cuts/cut.service';
import { CutController } from 'src/cuts/cut.controller';
import { CutRepository } from 'src/cuts/cut.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([Cut, Audit]), 
  ],
  controllers: [CutController],
  providers: [CutService, CutRepository],
})
export class CutModule {}
