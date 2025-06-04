"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, QueryTypes, Deferrable } from "sequelize";

let OtpModel = null;

const init = async (sequelize) => {
  OtpModel = sequelize.define(
    constants.models.OTP_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await OtpModel.sync({ alter: true });
};

const create = async ({ phone, otp }) => {
  const data = await OtpModel.create({
    otp: otp,
    phone: phone,
  });

  return data.dataValues;
};

const update = async ({ phone, otp }) => {
  return await OtpModel.update(
    { otp: otp },
    {
      where: {
        phone: phone,
      },
      returning: true,
      raw: true,
    }
  );
};

const getById = async (id) => {
  return await OtpModel.findOne({
    where: {
      id: id,
    },
    order: [["created_at", "DESC"]],
    limit: 1,
    raw: true,
    plain: true,
  });
};

const deleteByPhone = async (phone) => {
  return await OtpModel.destroy({
    where: { phone: phone },
  });
};

const deleteById = async (id) => {
  return await OtpModel.destroy({
    where: { id: id },
  });
};

export default {
  init: init,
  create: create,
  update: update,
  getById: getById,
  deleteByPhone: deleteByPhone,
  deleteById: deleteById,
};
