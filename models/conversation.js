module.exports = function(sequelize, Datatypes) {
    return sequelize.define('Conversation', {
        msg: Datatypes.STRING,
        sender: Datatypes.STRING,
        receiver: Datatypes.STRING,
        time: Datatypes.STRING
    });
};
