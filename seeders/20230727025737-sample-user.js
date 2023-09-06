'use strict';

module.exports = {
  up: async(queryInterface, Sequelize) =>{
    return queryInterface.bulkInsert('Users',[
      {
        name: 'taro',
        pass:'yamada',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'hanako',
        pass:'flower',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'jiro',
        pass:'change',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async(queryInterface, Sequelize) =>{
    return queryInterface.bulkDelete('Users', null, {});
  }
  
};