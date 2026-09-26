import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError, ZodType } from "zod";

function validationErrorResponse(error: ZodError) {
  return {
    error: "Validation failed",
    details: error.flatten(),
  };
}

export function validateBody<Schema extends ZodType>(
  schema: Schema,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(validationErrorResponse(parsed.error));
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateQuery<Schema extends ZodType>(
  schema: Schema,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json(validationErrorResponse(parsed.error));
      return;
    }

    req.query = parsed.data as Request["query"];
    next();
  };
}

export function validateParams<Schema extends ZodType>(
  schema: Schema,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json(validationErrorResponse(parsed.error));
      return;
    }

    req.params = parsed.data as Request["params"];
    next();
  };
}
