#!/bin/sh
echo 'DATABASE_URL="postgresql://viasuser:viaspassword@db:5432/viasglobal_db?schema=public"' > .env
npx prisma migrate deploy
