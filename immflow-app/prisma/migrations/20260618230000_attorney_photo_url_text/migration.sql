-- Base64 profile photos exceed VARCHAR(191); align with Prisma @db.Text
ALTER TABLE `attorneys` MODIFY `photo_url` MEDIUMTEXT NULL;
