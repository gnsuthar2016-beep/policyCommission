const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    console.log('Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✓ Models synced successfully');

    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('✓ Database already contains users. Skipping seeding.');
      process.exit(0);
    }

    console.log('Seeding initial users...');
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123'
    });

    console.log('✓ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Email: test@example.com | Password: password123');
    console.log('Email: admin@example.com | Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
