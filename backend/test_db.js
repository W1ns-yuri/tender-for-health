const prisma = require('./src/lib/prisma');
async function main() {
  const comps = await prisma.company.findMany({
    where: { name: 'Sanly Enjamlar' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(comps);
  if (comps.length > 1) {
    // Delete all except the oldest one
    for (let i = 0; i < comps.length - 1; i++) {
      console.log('Deleting duplicate company:', comps[i].name, comps[i].inn);
      await prisma.user.delete({ where: { id: comps[i].userId } });
    }
  }
}
main().finally(() => prisma.$disconnect());
