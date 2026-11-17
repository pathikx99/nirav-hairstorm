/**
 * telemetryService.ts
 * Performance Monitoring & Telemetry for Chromatique Avatar Rendering Engine.
 * 
 * Tracks:
 * - Initial avatar loading time
 * - Asset download time
 * - Shader initialization time
 * - Rendering latency (per-frame WebGL vs Canvas 2D)
 * - GPU memory / context loss events
 * - Fallback frequency and error diagnostics
 */

export interface AvatarTelemetryEvent {
  timestamp: number;
  renderer: "webgl2" | "canvas2d";
  event: "init" | "frame_render" | "fallback" | "context_loss" | "asset_load" | "shader_compile" | "error";
  durationMs?: number;
  fps?: number;
  view?: "front" | "back";
  errorReason?: string;
  metadata?: Record<string, unknown>;
}

class TelemetryService {
  private events: AvatarTelemetryEvent[] = [];
  private maxStoredEvents = 200;
  private fallbackCount = 0;
  private totalInits = 0;

  public logEvent(event: Omit<AvatarTelemetryEvent, "timestamp">): void {
    const fullEvent: AvatarTelemetryEvent = {
      ...event,
      timestamp: performance.now(),
    };

    if (event.event === "fallback") {
      this.fallbackCount++;
    } else if (event.event === "init") {
      this.totalInits++;
    }

    this.events.push(fullEvent);
    if (this.events.length > this.maxStoredEvents) {
      this.events.shift();
    }

    // In development mode, log useful performance summaries to console
    if (process.env.NODE_ENV !== "production") {
      if (event.event === "frame_render" && event.durationMs !== undefined) {
        // Debounce render logs or only log if significant
      } else if (event.event === "fallback" || event.event === "error") {
        console.warn(`[Avatar Telemetry] ${event.event.toUpperCase()}:`, event.errorReason, event.metadata);
      }
    }
  }

  public getRecentEvents(): AvatarTelemetryEvent[] {
    return [...this.events];
  }

  public getSummary() {
    const renderEvents = this.events.filter((e) => e.event === "frame_render" && e.durationMs !== undefined);
    const avgLatency =
      renderEvents.length > 0
        ? renderEvents.reduce((acc, e) => acc + (e.durationMs || 0), 0) / renderEvents.length
        : 0;

    return {
      totalInits: this.totalInits,
      fallbackCount: this.fallbackCount,
      fallbackRatePct: this.totalInits > 0 ? (this.fallbackCount / this.totalInits) * 100 : 0,
      recentAvgLatencyMs: avgLatency,
      recentAvgFps: avgLatency > 0 ? 1000.0 / avgLatency : 0,
      totalRecordedEvents: this.events.length,
    };
  }

  public clear(): void {
    this.events = [];
    this.fallbackCount = 0;
    this.totalInits = 0;
  }
}

export const avatarTelemetry = new TelemetryService();
