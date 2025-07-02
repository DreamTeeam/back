import { Module, Global } from '@nestjs/common';
import { IdConverterService } from './id-converter.service';

@Global()
@Module({
  providers: [IdConverterService],
  exports: [IdConverterService], 
})
export class SharedModule {}