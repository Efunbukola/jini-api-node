module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jini_clinical_skill', {
    jini_clinical_skill_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'pk_jini_clinical_skill_id'
    },
    jini_clinical_skill_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: false,
      field: 'jini_clinical_skill_name'
    }
  }, {
    tableName: 'jini_clinical_skill',
    timestamps: false
  });
};