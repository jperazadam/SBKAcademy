-- CreateEnum
CREATE TYPE "DanceType" AS ENUM ('SALSA', 'BACHATA', 'KIZOMBA');

-- CreateEnum
CREATE TYPE "DanceLevel" AS ENUM ('INICIO', 'MEDIO', 'AVANZADO');

-- CreateTable
CREATE TABLE "DanceClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "type" "DanceType" NOT NULL,
    "level" "DanceLevel" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" INTEGER NOT NULL,

    CONSTRAINT "DanceClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassScheduleEntry" (
    "id" SERIAL NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "ClassScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DanceClass" ADD CONSTRAINT "DanceClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassScheduleEntry" ADD CONSTRAINT "ClassScheduleEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "DanceClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
