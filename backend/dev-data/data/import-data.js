const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../config.env') });

const Tour = require('../../models/tourModel');

const DB = process.env.DB.replace('<DB_PASSWORD>', process.env.DB_PASSWORD);

const tours = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tours-simple.json'), 'utf-8'),
);

const connectDB = async () => {
  await mongoose.connect(DB);
  console.log('Connected to the DB...');
};

const importData = async () => {
  await Tour.create(tours);
  console.log('Data imported');
};

const deleteData = async () => {
  await Tour.deleteMany();
  console.log('Data deleted');
};

const run = async () => {
  try {
    await connectDB();

    if (process.argv.includes('--import')) {
      await importData();
    } else if (process.argv.includes('--delete')) {
      await deleteData();
    } else {
      console.log('Please use --import or --delete');
    }
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.connection.close();
  }
};

run().then();
