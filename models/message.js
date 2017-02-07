module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Message', {
        msg: Datatypes.STRING,
        time: Datatypes.STRING
    });
};
