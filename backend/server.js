const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

let server;

const startServer = async () => {
  const DB = process.env.DB.replace('<DB_PASSWORD>', process.env.DB_PASSWORD);

  await mongoose.connect(DB);
  console.log('Connected to the DB...');

  const port = process.env.PORT || 3000;
  server = app.listen(port, () => console.log(`App running on port: ${port}`));
};

startServer().catch((err) => {
  console.error('Application startup failed:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);

  if (!server) {
    process.exit(1);
    return;
  }

  server.close(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      process.exit(1);
    }
  });
});

/** Using native MongoDB driver */
/**
 *
 * const { MongoClient, ServerApiVersion } = require('mongodb');
 * const uri = "";
 *
 * // Create a MongoClient with a MongoClientOptions object to set the Stable API version
 * const client = new MongoClient(uri, {
 *   serverApi: {
 *     version: ServerApiVersion.v1,
 *     strict: true,
 *     deprecationErrors: true,
 *   }
 * });
 *
 * async function run() {
 *   try {
 *     // Connect the client to the server	(optional starting in v4.7)
 *     await client.connect();
 *     // Send a ping to confirm a successful connection
 *     await client.db("admin").command({ ping: 1 });
 *     console.log("Pinged your deployment. You successfully connected to MongoDB!");
 *   } finally {
 *     // Ensures that the client will close when you finish/error
 *     await client.close();
 *   }
 * }
 * run().catch(console.dir);
 */
