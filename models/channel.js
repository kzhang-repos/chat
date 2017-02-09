module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Channel', {
        id: {
            type: Datatypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }
    });
};
