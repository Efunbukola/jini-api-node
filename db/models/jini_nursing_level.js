module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jini_nursing_level', {
    jini_nursing_level_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'pk_jini_nursing_level_id'
    },
    jini_country_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: false,
      field: 'fk_jini_country_id'
    },
    jini_nursing_level_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
      field: 'jini_nursing_level_name'
    }
  }, {
    tableName: 'jini_nursing_level',
    timestamps: false
  });
};