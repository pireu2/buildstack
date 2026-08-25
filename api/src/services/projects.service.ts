import { AppDataSource } from '../data-source';
import { Project, User } from '../entities';
import { FindOptionsWhere } from 'typeorm';

export interface CreateProjectInput {
  title: string;
  userId: string;
  data?: Record<string, any>;
}

export interface UpdateProjectInput {
  title?: string;
  data?: Record<string, any>;
}

export class ProjectsService {
  private projectRepo = AppDataSource.getRepository(Project);
  private userRepo = AppDataSource.getRepository(User);

  async getProjects(userId: string) {
    const where: FindOptionsWhere<Project> = { user: { id: userId } };

    return await this.projectRepo.find({
      where,
      select: {
        id: true,
        title: true,
        data: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async getProjectById(id: string, userId: string) {
    const project = await this.projectRepo.findOne({
      where: { id, user: { id: userId } },
      select: {
        id: true,
        title: true,
        data: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      const error: any = new Error(`Project not found with id: ${id}`);
      error.status = 404;
      throw error;
    }

    return project;
  }

  async createProject(input: CreateProjectInput) {
    let user: User | undefined;
    if (input.userId) {
      user = (await this.userRepo.findOne({ where: { id: input.userId } })) || undefined;
    }

    const project = this.projectRepo.create({
      title: input.title,
      data: input.data || {},
      user,
      userId: input.userId,
    });

    return await this.projectRepo.save(project);
  }

  async updateProject(id: string, userId: string, input: UpdateProjectInput) {
    const project = await this.getProjectById(id, userId);

    if (input.title !== undefined) {
      project.title = input.title;
    }

    if (input.data !== undefined) {
      project.data = {
        ...project.data,
        ...input.data,
      };
    }

    return await this.projectRepo.save(project);
  }

  async deleteProject(id: string, userId: string) {
    const project = await this.getProjectById(id, userId);
    await this.projectRepo.remove(project);
    return { success: true, message: `Project ${id} deleted successfully.` };
  }
}

export const projectsService = new ProjectsService();
