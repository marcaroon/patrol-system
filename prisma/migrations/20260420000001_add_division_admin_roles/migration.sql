-- prisma/migrations/20260420000001_add_division_admin_roles/migration.sql
-- Add new admin roles for Security and HSE specific dashboards
ALTER TABLE `admins` MODIFY COLUMN `role` ENUM('SUPER_ADMIN', 'VIEWER', 'SECURITY_ADMIN', 'HSE_ADMIN') NOT NULL DEFAULT 'VIEWER';