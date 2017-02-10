var Sequelize = require('sequelize');

var db = {};

var sequelize = new Sequelize('chat', null, bull, {
    logging: console.log,
    port: 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    replication: {
        read: [
                { host: 'localhost', username: process.env['DB_USERNAME'], password: process.env['DB_PASSWORD']},
                { host: 'localhost', username: process.env['DB_USERNAME'], password: process.env['DB_PASSWORD']}
            ],
        write: { host: 'localhost', username: process.env['DB_USERNAME'], password: process.env['DB_PASSWORD']}
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

db.Message.belongsTo(db.User);
db.User.hasMany(db.Message);

db.Message.belongsTo(db.Channel);
db.Channel.hasMany(db.Message);

db.User.belongsToMany(db.Channel, {through: 'UserChannel'});
db.Channel.belongsToMany(db.User, {through: 'UserChannel'});

module.exports = db;

