"use strict";

import { DataTypes } from "sequelize";

let RequirementSequenceModel = null;

const init = async (sequelize) => {
  RequirementSequenceModel = sequelize.define(
    "requirement_sequences",
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      value: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    { createdAt: "created_at", updatedAt: "updated_at" }
  );

  await RequirementSequenceModel.sync({ alter: true });
  await RequirementSequenceModel.findOrCreate({
    where: { id: "requirement" },
    defaults: { value: 0 },
  });
};

const findOne = async () => {
  return await RequirementSequenceModel.findOne({
    where: { id: "requirement" },
    returning: true,
    raw: true,
  });
};

const update = async ({ value }) => {
  const [rowCount, rows] = await RequirementSequenceModel.update(
    {
      value: value,
    },
    { where: { id: "requirement" }, returning: true, plain: true }
  );

  return rows;
};

export default { init: init, update: update, findOne: findOne };
