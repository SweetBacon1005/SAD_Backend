import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { config } from 'dotenv';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/guard/auth.strategy';
import { MailService } from './mail/mail.service';
config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, MailService],
})
export class AppModule {}
