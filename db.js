var Sequelize = require('sequelize');

var db = {};

var sequelize = new Sequelize('chat', 'root', 'meowmeow', {
    logging: console.log,
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    timezone: 'America/Los_Angeles',
    pool: {
        max: 5,
    }
});

// var sequelize = new Sequelize('chat', null, 'meowmeow', {
//     logging: console.log,
//     port: 3306,
//     dialect: 'mysql',
//     replication: {
//         read: [
//                 { host: 'localhost', username: 'root', password: 'meowmeow'},
//                 { host: 'localhost', username: 'root', password: 'meowmeow'}
//             ],
//         write: { host: 'localhost', username: 'root', password: 'meowmeow'}
//     },
//     pool: {
//         maxConnections: 20,
//         maxIdleTime: 30000
//     }
// });

//one master two slaves. read and write from the master, read from the master and two slaves. shard based on channel id and 
//message createdAt.

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

