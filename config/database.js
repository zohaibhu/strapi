const path = require('path');

module.exports = ({ env }) => ({
  connection: {
    client: 'mysql',
    connection: {
      host: env('DATABASE_HOST', 'mysql.railway.internal'),
      port: env.int('DATABASE_PORT', 3306),
      database: env('DATABASE_NAME', 'railway'),  // Your MYSQL_DATABASE value
      user: env('DATABASE_USERNAME', 'root'),     // Your MYSQLUSER value
      password: env('DATABASE_PASSWORD', 'DUNHqkFPKTqTllToMWggbADRlnIAaUeg'), // Your MYSQLPASSWORD value
      ssl: {
        rejectUnauthorized: false
      }
    },
  },
});