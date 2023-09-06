'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User',{
    name:{
      type:DataTypes.STRING,
      validate:{
        notEmpty: true
      }
    },
    pass:{
      type:DataTypes.STRING,
      validate:{
        notEmpty: true
      }
    }
  },{});
  User.associate = function(models){
    ;
  }
  return User;
};
