import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Req,
	Res,
} from "@nestjs/common";

import {
	ApiBearerAuth,
	ApiCookieAuth,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Public } from "src/common/decorators/public.decorator";
import type { User } from "../database/schema";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password-dto";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password-dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	// POST /api/auth/register
	@Public()
	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	async register(@Body() dto: RegisterDTO) {
		return this.authService.register(dto);
	}

	// GET /api/auth/verify-email
	@Public()
	@Get("verify-email")
	@ApiOperation({ summary: "Verify email address and auto-login" })
	async verifyEmail(
		@Query("token") token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		return this.authService.verifyEmail(token, res);
	}

	// POST /api/auth/login
	@Throttle({ default: { ttl: 60000, limit: 5 } })
	@Public()
	@Post("login")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Login and receive access + refresh tokens" })
	async login(
		@Body() dto: LoginDTO,
		@Res({ passthrough: true }) res: Response,
	) {
		return this.authService.login(dto, res);
	}

	// POST /api/auth/refresh
	@Public()
	@Post("refresh")
	@HttpCode(HttpStatus.OK)
	@ApiCookieAuth()
	@ApiOperation({ summary: "Refresh access token using refresh token cookie" })
	async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const cookies = req.cookies as Record<string, string>;

		const refreshToken = cookies?.refresh_token;

		return this.authService.refresh(refreshToken, res);
	}

	// POST /api/auth/logout

	@Post("logout")
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Logout and invalidate refresh token" })
	async logout(
		@CurrentUser() user: User,
		@Res({ passthrough: true }) res: Response,
	) {
		return this.authService.logout(user.id, res);
	}

	// POST /api/auth/me
	@Get("me")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get current authenticated user" })
	me(@CurrentUser() user: User) {
		return {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			isVerified: user.isVerified,
		};
	}

	// POST /api/auth/forgot-password
	@Throttle({ default: { ttl: 60000, limit: 3 } })
	@Public()
	@Post("forgot-password")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Request a password reset email" })
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.authService.forgotPassword(dto.email);
	}

	// POST /api/auth/reset-password

	@Public()
	@Post("reset-password")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Reset password using token from email" })
	async resetPassword(@Body() dto: ResetPasswordDto) {
		return this.authService.resetPassword(dto.token, dto.password);
	}
}
