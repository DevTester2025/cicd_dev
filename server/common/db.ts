export interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: string;
  logging: boolean | Function;
  force: boolean;
  timezone: string;
  retry;
  pool;
  dialectOptions;
}
export const databaseConfig: DatabaseConfig = {
  username: process.env.APP_DB_USER,
  password: process.env.APP_DB_PASS,
  database: process.env.APP_DB_NAME,
  host: process.env.APP_DB_HOST,
  port: 3306,
  dialect: "mysql",
  logging: true,
  force: true,
  timezone: "+00:00",
  pool: {
    max: 100,
    min: 0,
    acquire: 1200000,
    idle: 1000000,
  },
  dialectOptions: {
    // set the lock wait timeout value to 360 seconds
    innodb_lock_wait_timeout: 360000
  },
  retry: {
    match: [/Deadlock/i],
    max: 3, // Maximum rety 3 times
    backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
    backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
  },
};
// export const databaseConfig: DatabaseConfig = {
//     username: 'root',
//     password: 'password',
//     database: 'csdm',
//     host: 'localhost',
//     port: 3306,
//     dialect: 'mysql',
//     logging: true,
//     force: true,
//     timezone: '+00:00'
// };
