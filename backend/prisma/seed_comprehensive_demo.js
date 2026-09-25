require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function seedComprehensiveDemo() {
  console.log('🚀 Starting Comprehensive Healthcare Demo Seed...');

  // 1. Password hash for test accounts
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const supplierPasswordHash = await bcrypt.hash('supplier123', 10);

  // 2. Ensure Admin User exists
  let adminUser = await prisma.user.findFirst({ where: { roleType: 'ADMIN' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPasswordHash,
        firstName: 'Главный',
        lastName: 'Администратор',
        roleType: 'ADMIN',
        position: 'Руководитель тендерного комитета',
        phone: '+993 12 40-00-01',
        isActive: true,
      },
    });
    console.log('✅ Admin user created: admin / admin123');
  } else {
    console.log('ℹ️ Admin user already exists:', adminUser.username);
  }

  // 3. Ensure Currencies exist
  const currenciesData = [
    { code: 'TMT', name: 'Туркменский манат', symbol: 'TMT', order: 1 },
    { code: 'USD', name: 'Доллар США', symbol: '$', order: 2 },
    { code: 'EUR', name: 'Евро', symbol: '€', order: 3 },
  ];
  const currencies = {};
  for (const c of currenciesData) {
    currencies[c.code] = await prisma.currency.upsert({
      where: { code: c.code },
      update: { name: c.name, symbol: c.symbol, isActive: true },
      create: { code: c.code, name: c.name, symbol: c.symbol, order: c.order, isActive: true },
    });
  }
  console.log('✅ Currencies verified');

  // 4. Ensure Delivery Terms exist
  const deliveryTermsData = [
    { shortName: 'DDP', name: 'DDP - Доставка до клиники с оплатой пошлин' },
    { shortName: 'DAP', name: 'DAP - Доставка в пункт назначения' },
    { shortName: 'CIP', name: 'CIP - Перевозка и страхование оплачены' },
  ];
  const deliveryTerms = {};
  for (const dt of deliveryTermsData) {
    let item = await prisma.deliveryTerm.findFirst({ where: { shortName: dt.shortName } });
    if (!item) {
      item = await prisma.deliveryTerm.create({ data: { shortName: dt.shortName, name: dt.name, isActive: true } });
    }
    deliveryTerms[dt.shortName] = item;
  }
  console.log('✅ Delivery Terms verified');

  // 5. Ensure Units exist
  const unitsData = [
    { shortName: 'шт', name: 'штука' },
    { shortName: 'упак', name: 'упаковка' },
    { shortName: 'фл', name: 'флакон' },
    { shortName: 'компл', name: 'комплект' },
    { shortName: 'кор', name: 'коробка' },
  ];
  const units = {};
  for (const u of unitsData) {
    let item = await prisma.unit.findFirst({ where: { shortName: u.shortName } });
    if (!item) {
      item = await prisma.unit.create({ data: { shortName: u.shortName, name: u.name, isActive: true } });
    }
    units[u.shortName] = item;
  }
  console.log('✅ Units verified');

  // 6. Ensure Country exists
  let tmCountry = await prisma.country.findFirst({ where: { alpha2: 'TM' } });
  if (!tmCountry) {
    tmCountry = await prisma.country.create({
      data: { name: 'Туркменистан', alpha2: 'TM', alpha3: 'TKM', order: 1, isActive: true },
    });
  }

  // 7. Ensure Categories exist
  const categoriesData = [
    { code: 'PHARMA', name: 'Фармацевтика и лекарственные препараты' },
    { code: 'MED_EQUIP', name: 'Медицинское и диагностическое оборудование' },
    { code: 'CONSUMABLES', name: 'Расходные материалы и лабораторные тест-системы' },
    { code: 'HEALTH_IT', name: 'IT-инфраструктура и медицинские информационные системы' },
    { code: 'FACILITY_SERVICE', name: 'Ремонт, сервисное обслуживание и клининг ЛПУ' },
  ];
  const categories = {};
  for (const cat of categoriesData) {
    categories[cat.code] = await prisma.category.upsert({
      where: { code: cat.code },
      update: { name: cat.name, isActive: true },
      create: { code: cat.code, name: cat.name, isActive: true },
    });
  }
  console.log('✅ Categories verified');

  // 8. Ensure Clients (Госпитальные Заказчики) exist
  const clientsData = [
    'Министерство здравоохранения и медицинской промышленности Туркменистана',
    'Международный центр кардиологии г. Ашхабад',
    'Многопрофильная больница г. Аркадаг',
    'Научно-клинический центр онкологии г. Ашхабад',
    'Диагностический центр Марыйского велаята',
    'Лебапский велаятский многопрофильный госпиталь',
    'Балканский велаятский кардиологический центр',
  ];
  const clients = {};
  for (const name of clientsData) {
    let client = await prisma.client.findFirst({ where: { name } });
    if (!client) {
      client = await prisma.client.create({ data: { name, isActive: true } });
    }
    clients[name] = client;
  }
  console.log('✅ Clients verified');

  // 9. Ensure Verified Suppliers exist (ONLY roleType: 'SUPPLIER')
  const suppliersData = [
    {
      username: 'derman_saglyk',
      firstName: 'Мердан',
      lastName: 'Овезов',
      phone: '+993 12 34-11-22',
      companyName: 'Hojalyk Jemgyýeti «Derman Saglyk»',
      type: 'BUSINESS_SOCIETY',
      taxId: '102345678901',
      regNumber: 'REG-TM-2022-881',
      licenseNumber: 'MED-LIC-00451-TM',
      isMedicalLicensed: true,
      address: 'г. Ашхабад, проспект Битараплык, д. 142',
      region: 'г. Ашхабад',
      bankName: 'АКБ «Рысгал»',
      bankAccount: '23204934100012345678000',
      bankMfo: '390101801',
      directorName: 'Овезов М.Б.',
      categories: ['PHARMA', 'CONSUMABLES'],
    },
    {
      username: 'medtehnika',
      firstName: 'Батыр',
      lastName: 'Аннаев',
      phone: '+993 12 21-55-44',
      companyName: 'ÝGP «MedTehnika Üpjünçilik»',
      type: 'BUSINESS_COMPANY',
      taxId: '102345678902',
      regNumber: 'REG-TM-2021-419',
      licenseNumber: 'MED-LIC-00388-TM',
      isMedicalLicensed: true,
      address: 'г. Аркадаг, ул. Сейди, здание 12',
      region: 'г. Аркадаг',
      bankName: 'Государственный банк внешнеэкономической деятельности Туркменистана',
      bankAccount: '23204934100098765432000',
      bankMfo: '390101701',
      directorName: 'Аннаев Б.Г.',
      categories: ['MED_EQUIP', 'FACILITY_SERVICE'],
    },
    {
      username: 'arassa_lukman',
      firstName: 'Сердар',
      lastName: 'Бердиев',
      phone: '+993 522 6-77-88',
      companyName: 'HK «Arassa Lukman Enjamlary»',
      type: 'BUSINESS_SOCIETY',
      taxId: '102345678903',
      regNumber: 'REG-TM-2023-112',
      licenseNumber: 'MED-LIC-00512-TM',
      isMedicalLicensed: true,
      address: 'г. Мары, ул. Байрамхан, д. 8',
      region: 'Марыйский велаят',
      bankName: 'ГКБТ «Дайханбанк»',
      bankAccount: '23204934100055443322000',
      bankMfo: '390101401',
      directorName: 'Бердиев С.К.',
      categories: ['CONSUMABLES', 'FACILITY_SERVICE'],
    },
    {
      username: 'sanly_lukman',
      firstName: 'Руслан',
      lastName: 'Атаев',
      phone: '+993 12 99-33-00',
      companyName: 'HJ «Sanly Lukmançylyk Ulgamlary»',
      type: 'BUSINESS_SOCIETY',
      taxId: '102345678904',
      regNumber: 'REG-TM-2022-774',
      licenseNumber: 'IT-LIC-00109-TM',
      isMedicalLicensed: false,
      address: 'г. Ашхабад, ул. Огузхан, д. 201',
      region: 'г. Ашхабад',
      bankName: 'АКБ «Сенагат»',
      bankAccount: '23204934100066778899000',
      bankMfo: '390101601',
      directorName: 'Атаев Р.М.',
      categories: ['HEALTH_IT'],
    },
    {
      username: 'gurlusyk_med',
      firstName: 'Довран',
      lastName: 'Мурадов',
      phone: '+993 12 45-88-99',
      companyName: 'HJ «Gurluşyk Med Inžiniring»',
      type: 'BUSINESS_SOCIETY',
      taxId: '102345678905',
      regNumber: 'REG-TM-2020-602',
      licenseNumber: 'CONST-LIC-00844-TM',
      isMedicalLicensed: false,
      address: 'г. Ашхабад, ул. Андалип, д. 55',
      region: 'г. Ашхабад',
      bankName: 'АКБ «Туркменбаши»',
      bankAccount: '23204934100044332211000',
      bankMfo: '390101201',
      directorName: 'Мурадов Д.А.',
      categories: ['FACILITY_SERVICE'],
    },
    {
      username: 'bio_reagent',
      firstName: 'Айгуль',
      lastName: 'Клычева',
      phone: '+993 422 3-12-14',
      companyName: 'HK «BioReagent Standart»',
      type: 'ENTREPRENEUR',
      taxId: '102345678906',
      regNumber: 'REG-TM-2023-305',
      licenseNumber: 'MED-LIC-00621-TM',
      isMedicalLicensed: true,
      address: 'г. Туркменабат, ул. Азатлык, д. 19',
      region: 'Лебапский велаят',
      bankName: 'АКБ «Халкбанк»',
      bankAccount: '23204934100088990011000',
      bankMfo: '390101301',
      directorName: 'Клычева А.П.',
      categories: ['PHARMA', 'CONSUMABLES'],
    },
  ];

  const suppliers = {};
  for (const s of suppliersData) {
    let user = await prisma.user.findUnique({ where: { username: s.username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: s.username,
          password: supplierPasswordHash,
          firstName: s.firstName,
          lastName: s.lastName,
          roleType: 'SUPPLIER',
          position: 'Генеральный директор',
          phone: s.phone,
          isActive: true,
        },
      });
    }

    let supplier = await prisma.supplier.findFirst({ where: { userId: user.id } });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          userId: user.id,
          name: s.companyName,
          type: s.type,
          taxId: s.taxId,
          regNumber: s.regNumber,
          licenseNumber: s.licenseNumber,
          isMedicalLicensed: s.isMedicalLicensed,
          phone: s.phone,
          address: s.address,
          region: s.region,
          verificationStatus: 'VERIFIED',
          bankName: s.bankName,
          bankAccount: s.bankAccount,
          bankMfo: s.bankMfo,
          directorName: s.directorName,
          countryId: tmCountry.id,
          isActive: true,
        },
      });
    } else {
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: { verificationStatus: 'VERIFIED' },
      });
    }

    // Link categories to supplier
    for (const catCode of s.categories) {
      const cat = categories[catCode];
      if (cat) {
        await prisma.supplierCategory.upsert({
          where: {
            supplierId_categoryId: { supplierId: supplier.id, categoryId: cat.id },
          },
          update: {},
          create: { supplierId: supplier.id, categoryId: cat.id },
        });
      }
    }

    suppliers[s.username] = { user, supplier };
  }
  console.log('✅ Suppliers verified and assigned categories');

  // 10. General Products (МНН)
  const productsData = [
    { name: 'Инсулин гларгин 100 ЕД/мл 3мл картриджи', cat: 'PHARMA' },
    { name: 'Цефтриаксон 1.0 г порошок д/приг. р-ра для в/в и в/м введения', cat: 'PHARMA' },
    { name: 'Карведилол 25 мг таблетки', cat: 'PHARMA' },
    { name: 'Магнитно-резонансный томограф (МРТ) 1.5 Тесла экспертного класса', cat: 'MED_EQUIP' },
    { name: 'Ультразвуковая диагностическая система экспертного класса с цветным доплером', cat: 'MED_EQUIP' },
    { name: 'Прикроватный монитор пациента мультипараметрический', cat: 'MED_EQUIP' },
    { name: 'Шприцы трехкомпонентные одноразовые стерильные 5 мл', cat: 'CONSUMABLES' },
    { name: 'ПЦР тест-системы для выявления респираторных вирусных инфекций', cat: 'CONSUMABLES' },
    { name: 'Серверный комплекс хранения и передачи медицинских изображений (PACS)', cat: 'HEALTH_IT' },
    { name: 'Ламинарные системы очистки воздуха и вентиляции операционных залов', cat: 'FACILITY_SERVICE' },
  ];
  const products = {};
  for (const p of productsData) {
    let item = await prisma.generalProduct.findFirst({ where: { name: p.name } });
    if (!item) {
      item = await prisma.generalProduct.create({
        data: {
          name: p.name,
          categoryId: categories[p.cat]?.id,
          isActive: true,
        },
      });
    }
    products[p.name] = item;
  }
  console.log('✅ General Products verified');

  // 11. Create Realistic Tenders Across Various Spheres and Statuses
  const tendersSeed = [
    // TENDER 1: Awarded (YENIJI_YGLAN_EDILDI) - Pharma
    {
      number: 'TND-2026-001',
      title: 'Централизованная закупка кардиологических и гипотензивных препаратов для стационаров',
      description: 'Поставка жизненно важных кардиопрепаратов для обеспечения отделений неотложной кардиологии и кардиохирургии.',
      price: 1950000,
      clientName: 'Международный центр кардиологии г. Ашхабад',
      catCode: 'PHARMA',
      status: 'YENIJI_YGLAN_EDILDI',
      deadline: new Date(Date.now() - 15 * 86400000), // ended 15 days ago
      lots: [
        {
          name: 'Лот №1: Инъекционные кардиологические препараты',
          specs: [
            { productName: 'Инсулин гларгин 100 ЕД/мл 3мл картриджи', qty: 6000, unit: 'упак' },
            { productName: 'Цефтриаксон 1.0 г порошок д/приг. р-ра для в/в и в/м введения', qty: 25000, unit: 'фл' },
          ],
        },
        {
          name: 'Лот №2: Таблетированные антигипертензивные средства',
          specs: [
            { productName: 'Карведилол 25 мг таблетки', qty: 15000, unit: 'упак' },
          ],
        },
      ],
      offers: [
        {
          supplierKey: 'derman_saglyk',
          isWinner: true,
          unitPrices: [145, 18, 32], // 6000*145 + 25000*18 + 15000*32 = 870k + 450k + 480k = 1,800,000 TMT
        },
        {
          supplierKey: 'bio_reagent',
          isWinner: false,
          unitPrices: [152, 20, 34], // 6000*152 + 25000*20 + 15000*34 = 912k + 500k + 510k = 1,922,000 TMT
        },
      ],
    },

    // TENDER 2: Awarded (YENIJI_YGLAN_EDILDI) - Med Equipment
    {
      number: 'TND-2026-002',
      title: 'Поставка высокотехнологичного диагностического оборудования (МРТ и цифровые УЗИ сканеры)',
      description: 'Оснащение нового клинико-диагностического корпуса экспертной визуализационной техникой.',
      price: 6800000,
      clientName: 'Многопрофильная больница г. Аркадаг',
      catCode: 'MED_EQUIP',
      status: 'YENIJI_YGLAN_EDILDI',
      deadline: new Date(Date.now() - 20 * 86400000),
      lots: [
        {
          name: 'Лот №1: Высокопольный магнитно-резонансный томограф',
          specs: [
            { productName: 'Магнитно-резонансный томограф (МРТ) 1.5 Тесла экспертного класса', qty: 1, unit: 'компл' },
          ],
        },
        {
          name: 'Лот №2: Ультразвуковые диагностические сканеры экспертного класса',
          specs: [
            { productName: 'Ультразвуковая диагностическая система экспертного класса с цветным доплером', qty: 2, unit: 'компл' },
            { productName: 'Прикроватный монитор пациента мультипараметрический', qty: 10, unit: 'шт' },
          ],
        },
      ],
      offers: [
        {
          supplierKey: 'medtehnika',
          isWinner: true,
          unitPrices: [4800000, 680000, 29000], // 4.8M + 1.36M + 290k = 6,450,000 TMT
        },
      ],
    },

    // TENDER 3: Awarded (YENIJI_YGLAN_EDILDI) - Health IT
    {
      number: 'TND-2026-003',
      title: 'Внедрение защищенного серверного комплекса хранения медицинских снимков PACS',
      description: 'Построение централизованного защищенного хранилища данных лучевой диагностики.',
      price: 2400000,
      clientName: 'Министерство здравоохранения и медицинской промышленности Туркменистана',
      catCode: 'HEALTH_IT',
      status: 'YENIJI_YGLAN_EDILDI',
      deadline: new Date(Date.now() - 10 * 86400000),
      lots: [
        {
          name: 'Лот №1: Серверная платформа и система хранения PACS',
          specs: [
            { productName: 'Серверный комплекс хранения и передачи медицинских изображений (PACS)', qty: 1, unit: 'компл' },
          ],
        },
      ],
      offers: [
        {
          supplierKey: 'sanly_lukman',
          isWinner: true,
          unitPrices: [2150000], // 2,150,000 TMT
        },
      ],
    },

    // TENDER 4: In Evaluation (BAHALANDYRYLDY) - Consumables
    {
      number: 'TND-2026-004',
      title: 'Закупка расходных материалов и средств инфекционного контроля для стационаров',
      description: 'Поставка одноразовых стерильных изделий медицинского назначения для госпиталей велаята.',
      price: 850000,
      clientName: 'Диагностический центр Марыйского велаята',
      catCode: 'CONSUMABLES',
      status: 'BAHALANDYRYLDY',
      deadline: new Date(Date.now() - 2 * 86400000), // ended 2 days ago
      lots: [
        {
          name: 'Лот №1: Одноразовый инъекционный инвентарь',
          specs: [
            { productName: 'Шприцы трехкомпонентные одноразовые стерильные 5 мл', qty: 500000, unit: 'шт' },
          ],
        },
      ],
      offers: [
        {
          supplierKey: 'arassa_lukman',
          isWinner: false,
          unitPrices: [1.55], // 775,000 TMT
        },
        {
          supplierKey: 'bio_reagent',
          isWinner: false,
          unitPrices: [1.60], // 800,000 TMT
        },
      ],
    },

    // TENDER 5: In Evaluation (BAHALANDYRYLDY) - Facility Service
    {
      number: 'TND-2026-005',
      title: 'Комплексное сервисное обслуживание систем ламинарной очистки операционных залов',
      description: 'Плановое техническое обслуживание и замена HEPA-фильтров в стерильных операционных блоках.',
      price: 1200000,
      clientName: 'Научно-клинический центр онкологии г. Ашхабад',
      catCode: 'FACILITY_SERVICE',
      status: 'BAHALANDYRYLDY',
      deadline: new Date(Date.now() - 1 * 86400000),
      lots: [
        {
          name: 'Лот №1: Сервис и замена фильтров систем вентиляции',
          specs: [
            { productName: 'Ламинарные системы очистки воздуха и вентиляции операционных залов', qty: 4, unit: 'компл' },
          ],
        },
      ],
      offers: [
        {
          supplierKey: 'gurlusyk_med',
          isWinner: false,
          unitPrices: [275000], // 1,100,000 TMT
        },
      ],
    },

    // TENDER 6: Open (ACYK) - Pharma
    {
      number: 'TND-2026-006',
      title: 'Поставка антибактериальных и противомикробных средств широкого спектра действия',
      description: 'Государственная закупка антибиотиков цефалоспоринового ряда для клинических больниц.',
      price: 3100000,
      clientName: 'Министерство здравоохранения и медицинской промышленности Туркменистана',
      catCode: 'PHARMA',
      status: 'ACYK',
      deadline: new Date(Date.now() + 14 * 86400000), // 14 days left
      lots: [
        {
          name: 'Лот №1: Антибиотики инъекционные',
          specs: [
            { productName: 'Цефтриаксон 1.0 г порошок д/приг. р-ра для в/в и в/м введения', qty: 150000, unit: 'фл' },
          ],
        },
      ],
      offers: [],
    },

    // TENDER 7: Open (ACYK) - Facility / Engineering
    {
      number: 'TND-2026-007',
      title: 'Модернизация инженерных коммуникаций и вентиляционных комплексов ожогового отделения',
      description: 'Капитальный ремонт климатических систем и стерильных боксов интенсивной терапии.',
      price: 1650000,
      clientName: 'Многопрофильная больница г. Аркадаг',
      catCode: 'FACILITY_SERVICE',
      status: 'ACYK',
      deadline: new Date(Date.now() + 20 * 86400000),
      lots: [
        {
          name: 'Лот №1: Монтаж и пусконаладка климатического оборудования',
          specs: [
            { productName: 'Ламинарные системы очистки воздуха и вентиляции операционных залов', qty: 6, unit: 'компл' },
          ],
        },
      ],
      offers: [],
    },

    // TENDER 8: Open (ACYK) - Lab & Diagnostics
    {
      number: 'TND-2026-008',
      title: 'Закупка клинических ПЦР тест-систем и расходных реагентов для лабораторий',
      description: 'Оснащение велаятских ПЦР-лабораторий тест-наборами для быстрой молекулярной диагностики.',
      price: 920000,
      clientName: 'Лебапский велаятский многопрофильный госпиталь',
      catCode: 'CONSUMABLES',
      status: 'ACYK',
      deadline: new Date(Date.now() + 12 * 86400000),
      lots: [
        {
          name: 'Лот №1: ПЦР диагностические наборы',
          specs: [
            { productName: 'ПЦР тест-системы для выявления респираторных вирусных инфекций', qty: 4000, unit: 'упак' },
          ],
        },
      ],
      offers: [],
    },

    // TENDER 9: Open (ACYK) - Med Equipment
    {
      number: 'TND-2026-009',
      title: 'Поставка портативных кардиологических мониторов и дефибрилляторов',
      description: 'Оснащение выездных бригад реанимации кардиомониторами с телеметрией.',
      price: 1400000,
      clientName: 'Балканский велаятский кардиологический центр',
      catCode: 'MED_EQUIP',
      status: 'ACYK',
      deadline: new Date(Date.now() + 25 * 86400000),
      lots: [
        {
          name: 'Лот №1: Кардиомониторы портативные',
          specs: [
            { productName: 'Прикроватный монитор пациента мультипараметрический', qty: 40, unit: 'шт' },
          ],
        },
      ],
      offers: [],
    },
  ];

  for (const tData of tendersSeed) {
    const existing = await prisma.tender.findUnique({ where: { tenderNumber: tData.number } });
    if (existing) {
      console.log(`ℹ️ Tender ${tData.number} already exists, skipping.`);
      continue;
    }

    const client = clients[tData.clientName];
    const category = categories[tData.catCode];
    const defaultDeliveryTerm = deliveryTerms['DDP'] || Object.values(deliveryTerms)[0];

    const tender = await prisma.tender.create({
      data: {
        tenderNumber: tData.number,
        title: tData.title,
        description: tData.description,
        price: tData.price,
        type: 'YERLI',
        status: tData.status,
        visibility: 'ACYK',
        announcementDate: new Date(Date.now() - 30 * 86400000),
        deadline: tData.deadline,
        clientId: client?.id || null,
        categoryId: category?.id || null,
        createdById: adminUser.id,
      },
    });

    const createdTenderSpecs = [];

    // Create Lots and Specs
    for (let lotIdx = 0; lotIdx < tData.lots.length; lotIdx++) {
      const lotData = tData.lots[lotIdx];
      const lot = await prisma.tenderLot.create({
        data: {
          tenderId: tender.id,
          lotNumber: lotIdx + 1,
          name: lotData.name,
          categoryId: category?.id || null,
          deliveryTermId: defaultDeliveryTerm?.id || null,
          deliveryAddress: client ? client.name : 'г. Ашхабад',
        },
      });

      for (let sIdx = 0; sIdx < lotData.specs.length; sIdx++) {
        const specItem = lotData.specs[sIdx];
        const prod = products[specItem.productName];
        const u = units[specItem.unit] || Object.values(units)[0];

        const tenderSpec = await prisma.tenderSpecification.create({
          data: {
            tenderId: tender.id,
            lotId: lot.id,
            generalProductId: prod?.id || null,
            name: specItem.productName,
            unitId: u?.id || null,
            quantity: specItem.qty,
            positionNumber: sIdx + 1,
          },
        });
        createdTenderSpecs.push(tenderSpec);
      }
    }

    // Create Offers if present
    for (const offData of tData.offers) {
      const suppObj = suppliers[offData.supplierKey];
      if (!suppObj) continue;

      let totalOfferedPrice = 0;
      for (let i = 0; i < createdTenderSpecs.length; i++) {
        const uPrice = offData.unitPrices[i] || 100;
        totalOfferedPrice += uPrice * createdTenderSpecs[i].quantity;
      }

      const offer = await prisma.offer.create({
        data: {
          tenderId: tender.id,
          supplierId: suppObj.supplier.id,
          status: offData.isWinner ? 'YENIJI' : 'TABSARYLDY',
          offeredPrice: totalOfferedPrice,
          paymentStatus: 'PAID',
          baseCurrencyId: currencies['TMT'].id,
          deliveryTermId: defaultDeliveryTerm?.id || null,
          paymentTerms: '100% постоплата в течение 30 календарных дней',
          comment: offData.isWinner
            ? 'Коммерческое предложение с гарантией оперативной поставки со склада.'
            : 'Альтернативное ценовое предложение.',
        },
      });

      for (let i = 0; i < createdTenderSpecs.length; i++) {
        const tSpec = createdTenderSpecs[i];
        const uPrice = offData.unitPrices[i] || 100;

        await prisma.offerSpecification.create({
          data: {
            offerId: offer.id,
            tenderSpecId: tSpec.id,
            generalProductId: tSpec.generalProductId,
            unitId: tSpec.unitId,
            name: tSpec.name,
            quantity: tSpec.quantity,
            unitPrice: uPrice,
            positionNumber: i + 1,
            isAwarded: offData.isWinner,
          },
        });
      }
    }

    console.log(`✅ Tender ${tData.number} created with status: ${tData.status} (budget: ${tData.price} TMT)`);
  }

  console.log('\n🎉 Comprehensive Healthcare Demo Seed COMPLETED SUCCESSFULLY!');
  console.log('------------------------------------------------------------');
  console.log('🔑 Credentials for Demo Testing:');
  console.log('   Admin:    admin / admin123');
  console.log('   Suppliers (password for all: supplier123):');
  console.log('     - derman_saglyk (HJ «Derman Saglyk» - Фармацевтика)');
  console.log('     - medtehnika (ÝGP «MedTehnika Üpjünçilik» - Медоборудование)');
  console.log('     - arassa_lukman (HK «Arassa Lukman Enjamlary» - Расходные материалы)');
  console.log('     - sanly_lukman (HJ «Sanly Lukmançylyk Ulgamlary» - IT и МИС)');
  console.log('     - gurlusyk_med (HJ «Gurluşyk Med Inžiniring» - Ремонт и клининг)');
  console.log('     - bio_reagent (HK «BioReagent Standart» - Диагностика)');
  console.log('------------------------------------------------------------');
}

seedComprehensiveDemo()
  .catch((err) => {
    console.error('❌ Error in seed script:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
