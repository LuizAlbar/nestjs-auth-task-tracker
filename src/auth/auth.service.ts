import crypto from "node:crypto";
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import type { User } from "src/database/schema";
import type { UsersService } from "src/users/users.service";
import type { LoginDTO } from "./dto/login.dto";
import type { RegisterDTO } from "./dto/register.dto";
import type { EmailService } from "./email.service";

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
		private configService: ConfigService,
		private emailService: EmailService,
	) {}

	async register(dto: RegisterDTO) {
		const existingUser = await this.usersService.findByEmail(dto.email);
		if (existingUser) {
			throw new ConflictException("An account with this email already exists");
		}

		const passwordHash = await bcrypt.hash(dto.password, 12);

		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationTokenExpiresAt = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		);

		const user = await this.usersService.create({
			email: dto.email,
			name: dto.name,
			passwordHash,
			verificationToken,
			verificationTokenExpiresAt,
		});

		void this.emailService.sendVerificationEmail(user.email, verificationToken);

		return {
			message:
				"Registration Successful. Please check your email to verify your account",
		};
	}

	async login(dto: LoginDTO, res: Response) {
		const user = await this.usersService.findByEmail(dto.email);

		if (!user) {
			throw new UnauthorizedException("Invalid email or password");
		}

		const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

		if (!passwordMatch) {
			throw new UnauthorizedException("Invalid email or password");
		}

		if (!user.isVerified) {
			throw new UnauthorizedException(
				"Please verify your email before logging in",
			);
		}

		const tokens = await this.generateToken(user);
		await this.saveRefreshToken(user.id, tokens.refreshToken);
		this.setRefreshTokenCookie(res, tokens.refreshToken);

		return {
			accessToken: tokens.accessToken,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		};
	}

	private async generateToken(user: User) {
		const payload = { sub: user.id, email: user.email, role: user.role };

		const accessToken = await this.jwtService.signAsync(payload, {
			secret: this.configService.get("JWT_ACCESS_SECRET"),
			expiresIn: this.configService.get("JWT_ACCESS_EXPIRES_IN "),
		});

		const refreshToken = await this.jwtService.signAsync(payload, {
			secret: this.configService.get("JWT_REFRESH_SECRET"),
			expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN "),
		});

		return {
			accessToken,
			refreshToken,
		};
	}

	async refresh(refreshToken: string, res: Response) {
		if (!refreshToken) {
			throw new UnauthorizedException("No refresh token provider");
		}
		let payload: { sub: string; email: string };
		try {
			payload = await this.jwtService.verifyAsync(refreshToken, {
				secret: this.configService.get("JWT_REFRESH_SECRET"),
			});
		} catch {
			throw new UnauthorizedException("Invalid or expired refresh token");
		}

		const user = await this.usersService.findById(payload.sub);
		if (!user?.refreshTokenHash) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const tokenMatch = await bcrypt.compare(
			refreshToken,
			user.refreshTokenHash,
		);

		if (!tokenMatch) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		const tokens = await this.generateToken(user);
		await this.saveRefreshToken(user.id, tokens.refreshToken);
		this.setRefreshTokenCookie(res, refreshToken);

		return {
			accessToken: tokens.accessToken,
		};
	}

	async logout(userId: string, res: Response) {
		await this.usersService.update(userId, { refreshTokenHash: null });
		res.clearCookie("refresh_token");
		return {
			message: "Logged out succesfully",
		};
	}

	private async saveRefreshToken(userId: string, refreshToken: string) {
		const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
		this.usersService.update(userId, { refreshTokenHash });
	}

	private setRefreshTokenCookie(res: Response, refreshToken: string) {
		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
	}
}
