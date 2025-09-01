module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_learning_profile', {
    user_learning_profile_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'pk_user_learning_profile_id'
    },
    user_id: {
      type:DataTypes.UUID,
      field: 'fk_user_id'
    },
    jini_avatar_id: {
      type:DataTypes.UUID,
      field: 'fk_jini_avatar_id'
    },
    jini_language_id: {
      type:DataTypes.UUID,
      field: 'fk_jini_language_id'
    },
    jini_clinical_skill_id: {
      type:DataTypes.UUID,
      field: 'fk_jini_clinical_skill_id'
    },
    jini_nursing_level_id: {
      type:DataTypes.UUID,
      field: 'fk_jini_nursing_level_id'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at'
    }
  }, {
    tableName: 'user_learning_profile',
    timestamps: false
  });
};