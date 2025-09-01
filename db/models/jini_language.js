module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jini_language', {
    jini_language_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'pk_jini_language_id'
    },
    jini_language_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
      field: 'jini_language_name'
    }
  }, {
    tableName: 'jini_language',
    timestamps: false
  });
};