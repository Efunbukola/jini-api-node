module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user', {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'pk_user_id'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,
      field: 'email'
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,
      field: 'password'
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name'
    },
    middle_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'middle_name'
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name'
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'country'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'city'
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'state'
    },
    zip: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'zip'
    },
    scribar_product_key: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: false,
      field: 'scribar_product_key'
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
    tableName: 'user',
    timestamps: false
  });
};



