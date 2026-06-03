import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db } from "src/database";
import { tasks } from "src/database/schema";
import { CreateTaskDto } from "./dto/create-task.dto";

@Injectable()
export class TasksService {
	async findAllForUser(userId: string) {
		return db.query.users.findMany({ where: eq(tasks.userId, userId) });
	}

	async create(userId: string, dto: CreateTaskDto) {
		const [task] = await db
			.insert(tasks)
			.values({ ...dto, userId })
			.returning();

		return task;
	}

	async update(id: string, userId: string, data: Partial<CreateTaskDto>) {
		const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });

		if (!task) throw new NotFoundException("Task not found");

		if (task.userId !== userId) {
			throw new ForbiddenException("You do not own this task");
		}

		const [updated] = await db
			.update(tasks)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string) {
		const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });

		if (!task) throw new NotFoundException("Task not found");

		if (task.userId !== userId) {
			throw new ForbiddenException("You do not own this task");
		}

		await db.delete(tasks).where(eq(tasks.id, id));

		return { message: "Task deleted successfully" };
	}
}
