/**
 * Health check service.
 * Per backend-rules.md: Business logic resides ONLY in the Services layer.
 */
export class HealthService {
  public getHealthStatus() {
    return {
      status: 'OK',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  public getHelloWorld() {
    return {
      greeting: 'Hello World! 🚀',
      project: 'Turkcell CodeNight 2026 Backend API',
    };
  }
}
