import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './database/database.module';
import {config} from 'dotenv';
config();


@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string), 
    DatabaseModule, 
  ],
})
export class AppModule {}
