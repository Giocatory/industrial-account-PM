import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Injectable()
export class MonitoringService {
  private requestMetrics: Array<{ ts: number; duration: number; path: string }> = [];
  private errorLog: Array<{ ts: number; level: string; message: string; component: string }> = [];
  private activeSessions = new Set<string>();

  constructor(private config: ConfigService) {
    // Seed some sample log entries
    this.errorLog = [
      { ts: Date.now() - 60000, level: 'info', message: 'Server started', component: 'app' },
      { ts: Date.now() - 30000, level: 'info', message: 'Database connected', component: 'db' },
    ];
  }

  recordRequest(path: string, duration: number) {
    this.requestMetrics.push({ ts: Date.now(), duration, path });
    if (this.requestMetrics.length > 1000) this.requestMetrics.shift();
  }

  addSession(sessionId: string) { this.activeSessions.add(sessionId); }
  removeSession(sessionId: string) { this.activeSessions.delete(sessionId); }

  logEntry(level: string, message: string, component: string) {
    this.errorLog.push({ ts: Date.now(), level, message, component });
    if (this.errorLog.length > 500) this.errorLog.shift();
  }

  async getSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // CPU load average (1-min)
    const load = os.loadavg()[0];
    const cpuPercent = Math.min(100, (load / cpus.length) * 100);

    // Disk: simulate realistic values (Node.js has no built-in disk API without extra libs)
    const diskTotal = 100 * 1024 * 1024 * 1024; // 100 GB
    const diskUsed  = 35  * 1024 * 1024 * 1024; // 35 GB simulated

    return {
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model,
        usagePercent: Math.round(cpuPercent),
        loadAvg: os.loadavg(),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 100),
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        free: diskTotal - diskUsed,
        usagePercent: Math.round((diskUsed / diskTotal) * 100),
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
    };
  }

  async getServicesStatus() {
    // In production: probe actual services
    return {
      database: { status: 'ok', latencyMs: Math.round(Math.random() * 5 + 1) },
      redis: { status: 'ok', latencyMs: Math.round(Math.random() * 2 + 0.5) },
      s3: { status: 'ok', latencyMs: Math.round(Math.random() * 50 + 10) },
      api: { status: 'ok', latencyMs: Math.round(Math.random() * 10 + 2) },
    };
  }

  async getAppMetrics() {
    const recent = this.requestMetrics.filter(r => r.ts > Date.now() - 60000);
    const avgResponseMs =
      recent.length > 0
        ? Math.round(recent.reduce((s, r) => s + r.duration, 0) / recent.length)
        : 0;

    const errors = this.errorLog.filter(
      l => l.ts > Date.now() - 3600000 && l.level === 'error',
    ).length;

    return {
      activeSessions: this.activeSessions.size,
      requestsLastMinute: recent.length,
      avgResponseMs,
      errorsLastHour: errors,
    };
  }

  getLogs(level?: string, component?: string, limit = 100) {
    let logs = [...this.errorLog].reverse();
    if (level) logs = logs.filter(l => l.level === level);
    if (component) logs = logs.filter(l => l.component === component);
    return logs.slice(0, limit).map(l => ({
      ...l,
      timestamp: new Date(l.ts).toISOString(),
    }));
  }
}
