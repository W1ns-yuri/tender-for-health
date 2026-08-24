require('dotenv').config();
const prisma = require('./src/lib/prisma');

async function main() {
  console.log('Очистка базы данных...');
  
  // Удаляем предложения (offers)
  const deletedOffers = await prisma.offer.deleteMany({});
  console.log('Удалено предложений:', deletedOffers.count);
  
  // Удаляем тендеры
  const deletedTenders = await prisma.tender.deleteMany({});
  console.log('Удалено тендеров:', deletedTenders.count);
  
  // Удаляем документы
  const deletedDocs = await prisma.document.deleteMany({});
  console.log('Удалено документов:', deletedDocs.count);
  
  console.log('База данных успешно очищена!');
}

main()
  .catch(e => {
    console.error('Ошибка при очистке:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
