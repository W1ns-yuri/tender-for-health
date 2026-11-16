-- Журнал аудита записывал currentPassword из смены пароля открытым текстом. Затираем уже записанное.
UPDATE "logs"
SET "data" = jsonb_set("data", '{body,currentPassword}', '"***HIDDEN***"')
WHERE "data" ? 'body' AND jsonb_typeof("data"->'body') = 'object' AND ("data"->'body') ? 'currentPassword';
