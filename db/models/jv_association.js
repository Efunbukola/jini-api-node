module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jv_association', {
    jv_association_association_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'pk_jv_association_association_id'
    },
    jv_topic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: false,
      field: 'fk_jv_topic_id'
    },
    journey_video_id: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: false,
      field: 'fk_journey_video_id'
    }
  }, {
    tableName: 'jv_association',
    timestamps: false
  });
};