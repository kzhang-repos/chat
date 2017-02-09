var bcrypt = require('bcrypt');

module.exports = function(sequelize, Datatypes) {
    return sequelize.define('User', {
        username: {type: Datatypes.STRING, validate: {isAlpha: true, len: [4, 10]}, allowNull: false, unique: true},
        password: {type: Datatypes.STRING,  validate: {len: [4, 10]}, allowNull: false}
    }, {
        hooks: {
            beforeCreate: function(user, options) {
                return new Promise(function(resolve, reject) {
                    bcrypt.hash(user.password, 10, function(err, hash) {
                        if (err) reject(err);
                        else resolve(hash);
                    })
                }).then(function(hash) {
                    user.password = hash;
                })
            }
        },
        instanceMethods: {
            authenticate: function(password, cb) {
                bcrypt.compare(password, this.password, function(err, isValid){
                    if (err) return cb(err);
                    else return cb(null, isValid);
                });
            }
        }
    }  
    );
};

