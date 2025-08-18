import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../services';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    this.loggerService.log(`Request: ${method} ${originalUrl}`);

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.loggerService.log(
        `Response: ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}
