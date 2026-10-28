import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../model/user.model.js';

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@akatsukidraft.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  let admin = await User.findOne({ email });

  if (admin) {
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log(`Promoted ${email} to admin`);
    } else {
      console.log(`Admin ${email} already exists`);
    }
  } else {
    admin = await User.create({ name, email, password, role: 'admin' });
    console.log(`Admin created: ${admin.email}`);
  }

  await disconnectDB();
  process.exit(0);
};

seedAdmin().catch(err => {
  console.error(err.message);
  process.exit(1);
});
