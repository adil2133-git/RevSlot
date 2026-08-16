import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/AppError.js';

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
      .map((issue) => issue.message).join(', ');

      return next(new AppError(message, 400));
    }
    req.body = result.data;
    next();
  };
};


export const validateParams = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const message = result.error.issues
      .map((issue) => issue.message).join(', ');
          return next(new AppError(message, 400));
        }
        
      req.params = result.data as typeof req.params;
      next();
   };
};


















