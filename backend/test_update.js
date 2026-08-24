const prisma = require('./src/lib/prisma');
async function main() {
  try {
    const comp = await prisma.company.findFirst();
    if (comp) {
      const updated = await prisma.company.update({
        where: { id: comp.id },
        data: { email: 'test@example.com' }
      });
      console.log('Update company success:', updated);
      
      const supplierUpdate = await prisma.supplier.updateMany({
          where: { userId: comp.userId },
          data: { email: 'test@example.com' }
      });
      console.log('Update supplier success:', supplierUpdate);
    }
  } catch(e) {
    console.error('Error:', e);
  }
}
main().finally(() => prisma.$disconnect());
