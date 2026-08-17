import "../env";
import type { NextFunction, Request, Response } from "express";
import { auth } from "express-oauth2-jwt-bearer";

function getAuth0Domain(): string {
  const domain = process.env.AUTH0_DOMAIN;
  if (!domain) {
    throw new Error("AUTH0_DOMAIN is not set");
  }
  return domain;
}

function getAuth0Audience(): string {
  const audience = process.env.AUTH0_AUDIENCE;
  if (!audience) {
    throw new Error("AUTH0_AUDIENCE is not set");
  }
  return audience;
}

export const checkJwt = auth({
  audience: getAuth0Audience(),
  issuerBaseURL: `https://${getAuth0Domain()}/`,
});

export function setTenantId(req: Request, res: Response, next: NextFunction): void {
  const sub = req.auth?.payload?.sub;
  if (typeof sub !== "string") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.tenantId = sub;
  next();
}
