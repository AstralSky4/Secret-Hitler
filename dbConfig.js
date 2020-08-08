const Sequelize = require('sequelize');

const database = {
    Sequelize: Sequelize,
    sequelize: new Sequelize('database', 'username', 'password', {
        host: 'localhost',
        dialect: 'sqlite',
        logging: false,
        storage: 'database.sqlite',
    })
}
module.exports = database;