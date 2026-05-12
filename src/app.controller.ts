import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ENVEnum } from './common/enum/env.enum';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html')
  getLanding(): string {
    const env =
      this.configService.get<string>(ENVEnum.NODE_ENV) ?? 'development';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const deploymentVersion = `v${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>yousef_backend_api</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0d0f14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e2e8f0;
    }
    .card {
      background: #161a27;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 36px 40px 28px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }
    .api-name {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
      color: #f1f5f9;
    }
    .description {
      font-size: 14px;
      color: #8b95a9;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .info-cell {
      background: #1e2235;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      margin-right: 7px;
      vertical-align: middle;
      position: relative;
      top: -1px;
    }
    .links {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .link-row {
      background: #1e2235;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #e2e8f0;
      font-size: 15px;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
    }
    .link-row:hover {
      background: #252a40;
      border-color: rgba(255,255,255,0.12);
    }
    .link-icon {
      font-size: 20px;
      line-height: 1;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #475569;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="api-name">yousef_backend_api</div>
    <p class="description">
      Backend API for YouSef — a full-featured platform with multi-module
      architecture, real-time capabilities, and secure authentication.
    </p>
    <span class="badge">Backend Service</span>

    <div class="info-grid">
      <div class="info-cell">
        <div class="info-label">Release Version</div>
        <div class="info-value">v1.0.0</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Deployment Version</div>
        <div class="info-value">${deploymentVersion}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Environment</div>
        <div class="info-value">${env}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Status</div>
        <div class="info-value"><span class="status-dot"></span>Online</div>
      </div>
    </div>

    <div class="links">
      <a href="/docs" class="link-row">
        <span class="link-icon">📘</span>
        API Documentation
      </a>
      <a href="/health" class="link-row">
        <span class="link-icon">❤️</span>
        Health Check
      </a>
    </div>

    <div class="footer">© ${now.getFullYear()} YouSef · All rights reserved</div>
  </div>
</body>
</html>`;
  }

  @Get('health')
  @ApiOkResponse({
    description: 'Returns service health status',
    schema: {
      example: { status: 'ok', timestamp: '2025-05-27T12:00:00.000Z' },
    },
  })
  getHealth(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
