import { Injectable, NotFoundException } from '@nestjs/common';
import { Cut } from './cut.entity';
import { CreateCutDto } from './create-cutDto';
import { UpdateCutDto } from './update-cutDto';
import { CutRepository } from './cut.repository';

@Injectable()
export class CutsService {
  constructor(private readonly repo: CutRepository) {}

  create(dto: CreateCutDto) {
    return this.repo.createCut(dto);
  }

  findAll() {
    return this.repo.findAll();
  }

  async findOne(id: string) {
    const cut = await this.repo.findOne(id);
    if (!cut) throw new NotFoundException(`Cut #${id} not found`);
    return cut;
  }

  update(id: string, dto: UpdateCutDto) {
    return this.repo.updateCut(id, dto);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { message: 'Cut eliminado correctamente' };
  }
}
