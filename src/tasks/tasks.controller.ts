import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import type { User } from "src/database/schema";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TasksService } from "./tasks.service";

@ApiTags("Tasks")
@ApiBearerAuth()
@Controller("tasks")
export class TasksController {
	constructor(private tasksService: TasksService) {}

	// GET /api/tasks

	@Get()
	@ApiOperation({ summary: "Getl all tasks for current user" })
	findAll(@CurrentUser() user: User) {
		return this.tasksService.findAllForUser(user.id);
	}

	// POST /api/tasks

	@Post()
	@ApiOperation({ summary: "Create a new user" })
	create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
		return this.tasksService.create(user.id, dto);
	}

	// PATCH /api/tasks

	@Patch(":id")
	@ApiOperation({ summary: "Update a task" })
	update(
		@CurrentUser() user: User,
		@Param("id") id: string,
		dto: Partial<CreateTaskDto>,
	) {
		return this.tasksService.update(id, user.id, dto);
	}

	// DELETE /api/tasks

	@Delete(":id")
	@ApiOperation({ summary: "Delete a task" })
	delete(@CurrentUser() user: User, @Param("id") id: string) {
		return this.tasksService.delete(id, user.id);
	}
}
