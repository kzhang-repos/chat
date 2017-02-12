var url = require('url');
var Sequelize = require('sequelize');
var config = require('./config');

var sequelize = new Sequelize(config.get('db.url'), {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: config.get('db.logging')
});

      sequelize = new Sequelize('chat', null, null, {
        logging: console.log,
        port: 3306,
        dialect: 'mysql',
        timezone: '-08:00',

        pool: {
            maxConnections: 20,
            maxIdleTime: 30000
        }
      });

    };

    global.db.Sequelize = Sequelize;
    global.db.sequelize = sequelize;

    global.db.User = sequelize.import(__dirname + '/models/user.js');
    global.db.Message = sequelize.import(__dirname + '/models/message.js');
    global.db.Channel = sequelize.import(__dirname + '/models/channel.js');

    global.db.Message.belongsTo(global.db.User);
    global.db.User.hasMany(global.db.Message);

    global.db.Message.belongsTo(global.db.Channel);
    global.db.Channel.hasMany(global.db.Message);

    global.db.User.belongsToMany(global.db.Channel, {through: 'UserChannel'});
    global.db.Channel.belongsToMany(global.db.User, {through: 'UserChannel'});
};

module.exports = global.db;

