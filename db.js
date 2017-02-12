var url = require('url');
var Sequelize = require('sequelize');
var Config = require('./config');
var config = new Config();

var sequelize = new Sequelize(config.get('db.url'), config.get('db'));

db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = sequelize.import(__dirname + '/models/user.js');
db.Message = sequelize.import(__dirname + '/models/message.js');
db.Channel = sequelize.import(__dirname + '/models/channel.js');

db.Message.belongsTo(global.db.User);
db.User.hasMany(global.db.Message);

db.Message.belongsTo(global.db.Channel);
db.Channel.hasMany(global.db.Message);

db.User.belongsToMany(global.db.Channel, {through: 'UserChannel'});
db.Channel.belongsToMany(global.db.User, {through: 'UserChannel'});

module.exports = db;

