-- CreateTable
CREATE TABLE "email-log" (
    "id" STRING NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "email-log_pkey" PRIMARY KEY ("id")
);
