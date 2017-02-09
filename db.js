var Sequelize = require('sequelize');

var db = {};

//one master two slaves. read and write from the master, read from the master and two slaves. 
//composite key for messages on ChannelId and when the message is created

var sequelize = new Sequelize('chat', null, 'meowmeow', {
    logging: console.log,
    port: 3306,
    dialect: 'mysql',
    timezone: '-00:00',
    replication: {
        read: [
                { host: 'localhost', username: 'root', password: 'meowmeow'},
                { host: 'localhost', username: 'root', password: 'meowmeow'}
            ],
        write: { host: 'localhost', username: 'root', password: 'meowmeow'}
    },
    pool: {
        maxConnections: 20,
        maxIdleTime: 30000
    }
});

db.sequelize = sequelize;

db.User = sequelize.import(__dirname + '/models/user.js');
db.Message = sequelize.import(__dirname + '/models/message.js');
db.Channel = sequelize.import(__dirname + '/models/channel.js');

db.Message.belongsTo(db.User, {foreignKey: 'UserId'});
db.User.hasMany(db.Message, {foreignKey: 'UserId'});

db.Message.belongsTo(db.Channel, {foreignKey: 'ChannelId'});
db.Channel.hasMany(db.Message, {foreignKey: 'ChannelId'});

db.User.belongsToMany(db.Channel, {through: 'UserChannel'});
db.Channel.belongsToMany(db.User, {through: 'UserChannel'});

module.exports = db;

