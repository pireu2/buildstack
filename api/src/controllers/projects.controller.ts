import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { projectsService } from '../services/projects.service';

export class ProjectsController {
  async getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const projects = await projectsService.getProjects(userId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const project = await projectsService.getProjectById(id as string, userId);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, data } = req.body;
      const userId = req.user!.id;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Project title is required and must be a non-empty string.',
        });
      }

      const project = await projectsService.createProject({
        title: title.trim(),
        userId,
        data,
      });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, data } = req.body;
      const userId = req.user!.id;

      if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Project title must be a non-empty string if provided.',
        });
      }

      const project = await projectsService.updateProject(id as string, userId, {
        title: title ? title.trim() : undefined,
        data,
      });

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await projectsService.deleteProject(id as string, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const projectsController = new ProjectsController();
