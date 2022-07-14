var pg = require("pg");
const config = {
    user: process.env.USER_NAME,
    database: process.env.DATABASE_NAME,
    password: process.env.PASSWORD,
    host:process.env.HOST,
    port:process.env.PORT               //Default port, change it if needed
};

const pool = new pg.Pool(config);

module.exports = pool