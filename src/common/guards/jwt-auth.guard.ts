import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/database/schema";
import { UsersService } from "src/users/users.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private jwtService: JwtService,
		private configService: ConfigService,
		private usersService: UsersService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) return true;

		const request = context
			.switchToHttp()
			.getRequest<Request & { user: User }>();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException("No access token provided");
		}

		let payload: { sub: string; email: string; role: string };

		try {
			payload = await this.jwtService.verifyAsync(token, {
				secret: this.configService.get("JWT_ACCESS_SECRET"),
			});
		} catch {
			throw new UnauthorizedException("Invalid or expired access token");
		}

		const user = await this.usersService.findById(payload.sub);

		if (!user) {
			throw new UnauthorizedException("User no longer exists");
		}

		request.user = user;

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] =
			(
				request.headers as unknown as Record<string, string>
			).authorization?.split(" ") ?? [];

		return type === "Bearer" ? token : undefined;
	}
}
