module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Message', {
        msg: Datatypes.STRING,
        read: Datatypes.STRING
    });
};
