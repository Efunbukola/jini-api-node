module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jini_country', {
    jini_country_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'pk_jini_country_id'
    },
    jini_country_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
      field: 'jini_country_name'
    }
  }, {
    tableName: 'jini_country',
    timestamps: false
  });
};