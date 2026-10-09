CREATE TABLE public."PublicApiRateLimit" (
  "endpoint" TEXT NOT NULL,
  "clientKey" CHAR(64) NOT NULL,
  "windowStart" TIMESTAMPTZ(3) NOT NULL,
  "requestCount" INTEGER NOT NULL CHECK ("requestCount" > 0),
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "PublicApiRateLimit_pkey"
    PRIMARY KEY ("endpoint", "clientKey", "windowStart")
);

CREATE INDEX "PublicApiRateLimit_expiresAt_idx"
  ON public."PublicApiRateLimit" ("expiresAt");
