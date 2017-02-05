var Sequelize = require('sequelize');

var db = {};

var sequelize = new Sequelize('chat', 'root', 'meowmeow', {
    logging: console.log,
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    pool: {max: 5}
});

db.sequelize = sequelize;

db.User = sequelize.import(__dirname + '/models/user.js');
db.Read = sequelize.import(__dirname + '/models/read.js');
db.Conversation = sequelize.import(__dirname + '/models/conversation.js');

module.exports = db;

