import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { UsersModule } from "./users/users.module";


@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			expandVariables: true,
		}),
		JwtModule.register({ global: true }),
		UsersModule,
		AuthModule,
	],
	providers: [{ provide: "APP_GUARD", useClass: JwtAuthGuard }],
})
export class AppModule {}
