require('dotenv').config();
const prisma = require('./src/lib/prisma');
const jwt = require('jsonwebtoken');

async function testPost() {
    const admin = await prisma.user.findUnique({ where: { username: 'sim_admin' }});
    if (!admin) {
        console.log('No admin found');
        return;
    }
    
    // Create a mock token
    const token = jwt.sign(
        { userId: admin.id, username: admin.username, roleType: admin.roleType },
        process.env.JWT_SECRET || 'supersecret_tender_key',
        { expiresIn: '1d' }
    );
    
    const payload = {
        title: 'Test Tender UI',
        description: 'Test description',
        technicalSpecs: 'Test tech specs',
        price: 50000,
        deadline: new Date('2026-02-12').toISOString(),
        type: 'YERLI',
        visibility: 'ACYK',
        status: 'ACYK',
        specs: [
          { positionNumber: 1, quantity: 5000, description: 'Test desc 1' }
        ]
    };
    
    console.log('Payload:', payload);

    try {
        const response = await fetch('http://localhost:5000/api/tenders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}
testPost();
