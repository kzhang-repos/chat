module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Message', {
        msg: Datatypes.STRING, 
        id: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }, 
        ChannelId: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            model: 'Channel', 
            key: 'ChannelId', 
            onDelete: 'cascade'
        }
    });
};
