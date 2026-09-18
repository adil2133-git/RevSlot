import type {Request, Response, NextFunction} from "express"

export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};