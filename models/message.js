module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Message', {
        msg: Datatypes.STRING, 
        ChannelId: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            references: "Channel", 
            referencesKey: "ChannelId", 
            onDelete: "cascade"
        },
        createdAt: {
            type: Datatypes.DATE,
            defaultValue: sequelize.fn('now'),
            primaryKey: true
        }
    });
};
