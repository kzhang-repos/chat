module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Read', {
        read: Datatypes.STRING,
        sender: Datatypes.STRING,
        receiver: Datatypes.STRING
    });
};