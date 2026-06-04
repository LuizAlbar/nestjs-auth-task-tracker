import { Controller, Delete, Get, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { UsersService } from "src/users/users.service";

@ApiTags("Admin")
@ApiBearerAuth()
@Roles("admin")
@Controller("admin")
export class AdminController {
	constructor(private usersService: UsersService) {}

	// GET /api/admin/users

	@Get("users")
	@ApiOperation({ summary: "List all users - admin only" })
	findAll() {
		return this.usersService.findAll();
	}

	// DELETE /api/admin/users

	@Delete("users/:id")
	@ApiOperation({ summary: "Delete a user - admin only" })
	remove(@Param("id") id: string) {
		return this.usersService.delete(id);
	}
}
