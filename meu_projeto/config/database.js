// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mensagem_db', 'mensagem_user', 'sua_senha', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = sequelize;
