import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = (req.headers['x-request-id'] || req.headers['x-correlation-id']) as string | undefined;

  let requestId: string;
  if (incomingId && typeof incomingId === 'string' && incomingId.length <= 128) {
    requestId = incomingId;
  } else {
    requestId = uuidv4();
  }

  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
