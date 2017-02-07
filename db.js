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
db.Message = sequelize.import(__dirname + '/models/message.js');
db.Channel = sequelize.import(__dirname + '/models/channel.js');

db.Message.belongsTo(db.User);
db.User.hasMany(db.Message);

db.Message.belongsTo(db.Channel);
db.Channel.hasMany(db.Message);

db.User.belongsToMany(db.Channel, {through: 'UserChannel'});
db.Channel.belongsToMany(db.User, {through: 'UserChannel'});

module.exports = db;

