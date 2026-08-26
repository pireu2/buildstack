import { SolutionOption } from '@/lib/api/solutions';

export interface ProjectChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ProjectDimensions {
  length_m: number;
  height_m: number;
  area_m2: number;
}

export interface ProjectIntakeAnswer {
  question: string;
  answer: string;
}

export interface ProjectData {
  prompt?: string;
  dimensions: ProjectDimensions;
  budget?: string;
  moisture_level?: string;
  intake_answers?: ProjectIntakeAnswer[];
  selected_option: SolutionOption;
  all_options?: SolutionOption[];
  messages?: ProjectChatMessage[];
}

export interface ProjectRecord {
  id: string;
  title: string;
  userId?: string;
  data: ProjectData;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  title: string;
  data: ProjectData;
}

export interface UpdateProjectDto {
  title?: string;
  data?: Partial<ProjectData>;
}

export interface ProjectsResponse {
  success: boolean;
  data: ProjectRecord[];
}

export interface SingleProjectResponse {
  success: boolean;
  data: ProjectRecord;
}
