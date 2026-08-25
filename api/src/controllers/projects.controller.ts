import { Request, Response, NextFunction } from 'express';
import { projectsService } from '../services/projects.service';

export class ProjectsController {
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const projects = await projectsService.getProjects(userId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await projectsService.getProjectById(id as string);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, userId, data } = req.body;
      const project = await projectsService.createProject({ title, userId, data });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, data } = req.body;
      const project = await projectsService.updateProject(id as string, { title, data });

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await projectsService.deleteProject(id as string);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const projectsController = new ProjectsController();
