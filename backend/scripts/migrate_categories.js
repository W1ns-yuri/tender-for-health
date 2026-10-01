const prisma = require('../src/lib/prisma');

async function migrate() {
  try {
    console.log('Adding type column to categories...');
    await prisma.$executeRawUnsafe(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'GOODS';`);
    
    // Update existing categories to their natural types
    await prisma.$executeRawUnsafe(`UPDATE categories SET type = 'WORKS' WHERE code IN ('CON-02') OR name ILIKE '%строитель%' OR name ILIKE '%монтаж%';`);
    await prisma.$executeRawUnsafe(`UPDATE categories SET type = 'SERVICES' WHERE code IN ('FACILITY_SERVICE', 'HEALTH_IT') OR name ILIKE '%обслуживание%' OR name ILIKE '%клининг%' OR name ILIKE '%услуг%';`);
    await prisma.$executeRawUnsafe(`UPDATE categories SET type = 'GOODS' WHERE type IS NULL;`);

    // Let's also insert realistic medical categories for WORKS and SERVICES if not present
    const existingWorks = await prisma.$queryRawUnsafe(`SELECT * FROM categories WHERE type = 'WORKS'`);
    if (existingWorks.length <= 1) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO categories (id, name, code, type, is_active) VALUES
        (gen_random_uuid(), 'Монтаж систем медицинских газов и кислородопроводов', 'WORKS_MED_GAS', 'WORKS', true),
        (gen_random_uuid(), 'Ремонтно-отделочные работы чистых помещений и операционных', 'WORKS_CLEAN_ROOMS', 'WORKS', true),
        (gen_random_uuid(), 'Монтаж вентиляции и систем обеззараживания воздуха', 'WORKS_HVAC_MED', 'WORKS', true)
        ON CONFLICT DO NOTHING;
      `);
    }

    const existingServices = await prisma.$queryRawUnsafe(`SELECT * FROM categories WHERE type = 'SERVICES'`);
    if (existingServices.length <= 2) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO categories (id, name, code, type, is_active) VALUES
        (gen_random_uuid(), 'Техническое и сервисное обслуживание медоборудования (ТО)', 'SERV_MED_MAINT', 'SERVICES', true),
        (gen_random_uuid(), 'Метрологический контроль, поверка и калибровка приборов', 'SERV_METROLOGY', 'SERVICES', true),
        (gen_random_uuid(), 'Сбор, транспортировка и утилизация опасных медотходов', 'SERV_WASTE_DISPOSAL', 'SERVICES', true),
        (gen_random_uuid(), 'Клинико-лабораторные диагностические исследования', 'SERV_LAB_TESTS', 'SERVICES', true)
        ON CONFLICT DO NOTHING;
      `);
    }

    // Now let's check general_products table: does it have item_type or can we add type column?
    console.log('Checking general_products...');
    await prisma.$executeRawUnsafe(`ALTER TABLE general_products ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'GOODS';`);
    await prisma.$executeRawUnsafe(`UPDATE general_products SET item_type = 'GOODS' WHERE item_type IS NULL;`);

    // Insert sample Services into general_products if not present
    const existingServiceProducts = await prisma.$queryRawUnsafe(`SELECT * FROM general_products WHERE item_type = 'SERVICES'`);
    if (existingServiceProducts.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO general_products (id, name, trade_name, code, item_type, is_active) VALUES
        (gen_random_uuid(), 'Техническое обслуживание томографа МРТ (ежеквартальный регламент)', 'Сервисный контракт МРТ', 'SRV-MRT-01', 'SERVICES', true),
        (gen_random_uuid(), 'Техническое обслуживание аппаратов ИВЛ и наркозно-дыхательных систем', 'ТО аппаратов ИВЛ', 'SRV-IVL-01', 'SERVICES', true),
        (gen_random_uuid(), 'Сбор и обезвреживание эпидемиологически опасных медицинских отходов класса Б и В', 'Утилизация медотходов', 'SRV-WASTE-01', 'SERVICES', true),
        (gen_random_uuid(), 'Поверка и метрологический контроль средств измерений медицинского назначения', 'Поверка дозаторов и тонометров', 'SRV-METR-01', 'SERVICES', true),
        (gen_random_uuid(), 'Комплексная дезинфекция и стерилизация операционных блоков', 'Санитарная обработка', 'SRV-DEZ-01', 'SERVICES', true)
        ON CONFLICT DO NOTHING;
      `);
    }

    // Insert sample Works into general_products if not present
    const existingWorkProducts = await prisma.$queryRawUnsafe(`SELECT * FROM general_products WHERE item_type = 'WORKS'`);
    if (existingWorkProducts.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO general_products (id, name, trade_name, code, item_type, is_active) VALUES
        (gen_random_uuid(), 'Монтаж медного кислородопровода высокого давления с консолями жизнеобеспечения', 'Монтаж кислородопровода', 'WRK-GAS-01', 'WORKS', true),
        (gen_random_uuid(), 'Устройство антибактериальных ламинарных потолков и герметичных стеновых панелей операционной', 'Чистые помещения', 'WRK-CLN-01', 'WORKS', true),
        (gen_random_uuid(), 'Капитальный ремонт и модернизация системы вентиляции инфекционного отделения', 'Вентиляция ЛПУ', 'WRK-VENT-01', 'WORKS', true),
        (gen_random_uuid(), 'Пусконаладочные работы и интеграция резервной дизель-генераторной установки больницы', 'Электромонтаж ДГУ', 'WRK-ELEC-01', 'WORKS', true)
        ON CONFLICT DO NOTHING;
      `);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
