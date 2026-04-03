import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Project, ProjectStatus } from '../projects/project.entity';
import { MaintenanceRequest, MaintenanceStatus } from '../maintenance/maintenance.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
    @InjectRepository(MaintenanceRequest) private maintenanceRepo: Repository<MaintenanceRequest>,
  ) {}

  async getMetrics(user: User) {
    switch (user.role) {
      case UserRole.CLIENT:
        return this.getClientMetrics(user.id);
      case UserRole.MANAGER:
        return this.getManagerMetrics(user.id);
      case UserRole.SENIOR_MANAGER:
      case UserRole.ADMIN:
        return this.getAdminMetrics();
      case UserRole.TECH_ADMIN:
        return this.getTechAdminMetrics();
      default:
        return {};
    }
  }

  private async getClientMetrics(clientId: string) {
    const [projects, maintenanceRequests] = await Promise.all([
      this.projectsRepo.find({ where: { clientId } }),
      this.maintenanceRepo.count({ where: { clientId } }),
    ]);

    const activeProject = projects.find(
      p => p.status !== ProjectStatus.COMPLETED,
    );

    return {
      totalProjects: projects.length,
      activeProject: activeProject || null,
      completedProjects: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      maintenanceRequests,
    };
  }

  private async getManagerMetrics(managerId: string) {
    const projects = await this.projectsRepo.find({ where: { managerId } });
    const maintenanceRequests = await this.maintenanceRepo.count({
      where: { managerId },
    });

    return {
      myProjects: projects.length,
      inProgressProjects: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      completedProjects: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      newMaintenanceRequests: await this.maintenanceRepo.count({
        where: { managerId, status: MaintenanceStatus.NEW },
      }),
      maintenanceRequests,
    };
  }

  private async getAdminMetrics() {
    const [
      totalUsers, pendingUsers, totalProjects, activeProjects,
      completedProjects, newMaintenance,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { status: UserStatus.PENDING } }),
      this.projectsRepo.count(),
      this.projectsRepo.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
      this.projectsRepo.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.maintenanceRepo.count({ where: { status: MaintenanceStatus.NEW } }),
    ]);

    return {
      totalUsers,
      pendingUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      newMaintenanceRequests: newMaintenance,
    };
  }

  private async getTechAdminMetrics() {
    return {
      message: 'Use /api/monitoring for system metrics',
    };
  }
}
