-- Единицы для ведомости объёмов работ (добавляются, только если такой ещё нет)
INSERT INTO "units" ("id", "name", "short_name", "order", "is_active")
SELECT gen_random_uuid()::text, v.name, v.short_name, v.ord, true
FROM (VALUES
    ('Метр', 'м', 30),
    ('Погонный метр', 'п.м', 31),
    ('Квадратный метр', 'м²', 32),
    ('Кубический метр', 'м³', 33),
    ('Километр', 'км', 34),
    ('Килограмм', 'кг', 35),
    ('Тонна', 'т', 36),
    ('Этап', 'этап', 37),
    ('Услуга', 'усл', 38)
) AS v(name, short_name, ord)
WHERE NOT EXISTS (SELECT 1 FROM "units" u WHERE lower(u.short_name) = lower(v.short_name));
