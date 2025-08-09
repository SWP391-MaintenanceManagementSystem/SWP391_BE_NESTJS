-- CreateTable
CREATE TABLE "public"."Token" (
    "tokenId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("tokenId")
);

-- CreateIndex
CREATE INDEX "IDX_Token_accountId" ON "public"."Token"("accountId");

-- AddForeignKey
ALTER TABLE "public"."Token" ADD CONSTRAINT "FK_Token_account_id_Account_id" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("accountId") ON DELETE NO ACTION ON UPDATE NO ACTION;
