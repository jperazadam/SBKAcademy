/*
  Warnings:

  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('professor', 'student');

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_teacherId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL;

-- DropTable
DROP TABLE "Student";
