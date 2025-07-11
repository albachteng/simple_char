
require('dotenv').config();
console.log('Loaded DATABASE_HOST:', process.env.DATABASE_HOST);
require('knex/bin/cli');
