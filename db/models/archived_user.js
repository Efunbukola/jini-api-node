module.exports = function(sequelize, DataTypes) {
  return sequelize.define('archived_user', {
    archived_user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'pk_archived_user_id'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,      field: 'email'
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,
      field: 'password'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: false,
      field: 'fk_role_id'
    },
    verification_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,
      field: 'verification_code'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at'
    }
  }, {
    tableName: 'archived_user',
    timestamps: false
  });
};