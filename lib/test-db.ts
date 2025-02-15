import db from './db-config'  // Remove .js extension

function testDatabase() {
  try {
    // Check database health
    console.log('Testing database connection...')
    
    // Insert test item
    const testItem = {
      id: 'test-123',
      name: 'Test Item',
      location: 'Test Location',
      description: 'Test Description',
      imageUrl: '',
      sold: false,
      paymentReceived: false,
      code: 'TEST123'
    }

    console.log('Inserting test item:', testItem)

    const stmt = db.prepare(`
      INSERT INTO items (id, name, location, description, imageUrl, sold, paymentReceived, code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      testItem.id,
      testItem.name,
      testItem.location,
      testItem.description,
      testItem.imageUrl,
      testItem.sold ? 1 : 0,
      testItem.paymentReceived ? 1 : 0,
      testItem.code
    )

    // Query items
    console.log('Querying all items...')
    const items = db.prepare('SELECT * FROM items').all()
    console.log('Items in database:', items)

  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testDatabase()