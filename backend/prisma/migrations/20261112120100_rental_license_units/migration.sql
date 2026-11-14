-- Единицы для лотов аренды техники и лицензий (добавляются, только если такой ещё нет)
INSERT INTO "units" ("id", "name", "short_name", "order", "is_active")
SELECT gen_random_uuid()::text, v.name, v.short_name, v.ord, true
FROM (VALUES
    ('Машино-час', 'маш.-ч', 50),
    ('Смена', 'смена', 51),
    ('Сутки', 'сут', 52),
    ('Месяц', 'мес', 53),
    ('Лицензия', 'лиц', 54),
    ('Год подписки', 'год', 55)
) AS v(name, short_name, ord)
WHERE NOT EXISTS (SELECT 1 FROM "units" u WHERE lower(u.short_name) = lower(v.short_name));
