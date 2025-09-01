module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bad_login_attempts', {
    user_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'user_id'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at'
    }
  }, {
    tableName: 'bad_login_attempts',
    timestamps: false
  });
};
