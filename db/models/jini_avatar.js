module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jini_avatar', {
    jini_avatar_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'pk_jini_avatar_id'
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'video_url'
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'photo_url'
    },
    name: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'name'
    },
    language: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'language'
    },
    ethnicity: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'ethnicity'
    },
    nationality: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'nationality'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at'
    }
  }, {
    tableName: 'jini_avatar',
    timestamps: false
  });
};

