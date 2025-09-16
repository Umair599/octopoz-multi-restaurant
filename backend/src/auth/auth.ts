import { Request, Response, NextFunction } from "express";
import { verify } from "./jwt";

export interface AuthRequest extends Request {
  user?: any;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing auth" });
  const parts = header.split(" ");
  if (parts.length !== 2)
    return res.status(401).json({ error: "Invalid auth" });
  const token = parts[1];
  const data = verify(token);
  if (!data) return res.status(401).json({ error: "Invalid token" });
  req.user = data;
  next();
}

export function ensureRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not auth" });
    if (req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
