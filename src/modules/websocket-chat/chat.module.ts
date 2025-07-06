import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MasterDataModule } from 'src/master_data/master_data.module';
import { ChatService } from './tenant-aware-chat.service';

@Module({
  imports: [MasterDataModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
