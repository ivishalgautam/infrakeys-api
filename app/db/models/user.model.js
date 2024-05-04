"use strict";
import constants from "../../lib/constants/index.js";
import hash from "../../lib/encryption/index.js";
import sequelizeFwk from "sequelize";
import { Op } from "sequelize";
import moment from "moment";

let UserModel = null;

const init = async (sequelize) => {
  UserModel = sequelize.define(
    constants.models.USER_TABLE,
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: sequelizeFwk.DataTypes.UUID,
        defaultValue: sequelizeFwk.DataTypes.UUIDV4,
      },
      username: {
        type: sequelizeFwk.DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      phone: {
        type: sequelizeFwk.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: sequelizeFwk.DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: sequelizeFwk.DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: sequelizeFwk.DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: sequelizeFwk.DataTypes.BOOLEAN,
        defaultValue: true,
      },
      role: {
        type: sequelizeFwk.DataTypes.ENUM({
          values: ["admin", "user", "subadmin"],
        }),
        defaultValue: "user",
      },
      channel_financing: {
        type: sequelizeFwk.DataTypes.ENUM("initiated", "approved", ""),
        defaultValue: "",
      },
      is_verified: {
        type: sequelizeFwk.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reset_password_token: {
        type: sequelizeFwk.DataTypes.STRING,
      },
      confirmation_token: {
        type: sequelizeFwk.DataTypes.STRING,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await UserModel.sync({ alter: true });
};

const create = async (req) => {
  const hash_password = hash.encrypt(req.body.password);
  return await UserModel.create({
    username: req.body.username,
    password: hash_password,
    name: req.body?.name,
    phone: req.body?.phone,
    email: req.body?.email,
    role: req.body?.role,
  });
};

const createCustomer = async (req) => {
  return await UserModel.create({
    name: req.body?.name,
    phone: req.body?.phone,
    email: req.body?.email,
  });
};

const get = async (req) => {
  const role = req.query?.role;
  return await UserModel.findAll({
    where: { role: role && role !== "admin" ? role : { [Op.ne]: "admin" } },
    order: [["created_at", "DESC"]],
    attributes: {
      exclude: ["password", "reset_password_token", "confirmation_token"],
    },
  });
};

const getById = async (req, user_id) => {
  return await UserModel.findOne({
    where: {
      id: req?.params?.id || user_id,
    },
    raw: true,
    attributes: [
      "id",
      "username",
      "name",
      "password",
      "is_active",
      "role",
      "phone",
      "email",
      "is_verified",
      "channel_financing",
    ],
  });
};

const getByUsername = async (req, record = undefined) => {
  return await UserModel.findOne({
    where: {
      username: req?.body?.username || record?.user?.username,
    },
    attributes: [
      "id",
      "username",
      "name",
      "password",
      "is_active",
      "role",
      "phone",
      "email",
      "is_verified",
      "channel_financing",
    ],
  });
};

const getByPhone = async (req, record = undefined) => {
  return await UserModel.findOne({
    where: {
      phone: req?.body?.phone || record?.user?.phone,
    },
    attributes: [
      "id",
      "username",
      "name",
      "password",
      "is_active",
      "role",
      "phone",
      "email",
      "is_verified",
      "channel_financing",
    ],
  });
};

const update = async (req, user_id) => {
  return await UserModel.update(
    {
      username: req.body?.username,
      name: req.body?.name,
      phone: req.body?.phone,
      role: req.body?.role,
      is_active: req.body?.is_active,
      is_verified: req.body?.is_verified,
      channel_financing: req.body?.channel_financing,
    },
    {
      where: {
        id: req.params?.id || user_id,
      },
      returning: [
        "id",
        "username",
        "name",
        "is_active",
        "role",
        "phone",
        "is_verified",
        "channel_financing",
      ],
      plain: true,
    }
  );
};

const updatePassword = async (req, user_id) => {
  const hash_password = hash.encrypt(req.body.new_password);
  return await UserModel.update(
    {
      password: hash_password,
    },
    {
      where: {
        id: req.params?.id || user_id,
      },
    }
  );
};

const deleteById = async (req, user_id) => {
  return await UserModel.destroy({
    where: {
      id: req?.params?.id || user_id,
    },
    returning: true,
    raw: true,
  });
};

const countUser = async (last_30_days = false) => {
  let where_query;
  if (last_30_days) {
    where_query = {
      createdAt: {
        [Op.gte]: moment()
          .subtract(30, "days")
          .format("YYYY-MM-DD HH:mm:ss.SSSZ"),
      },
    };
  }
  return await UserModel.findAll({
    where: where_query,
    attributes: [
      "role",
      [
        UserModel.sequelize.fn("COUNT", UserModel.sequelize.col("role")),
        "total",
      ],
    ],
    group: "role",
    raw: true,
  });
};

const getByEmailId = async (req) => {
  return await UserModel.findOne({
    where: {
      email: req.body.email,
    },
  });
};

const getByResetToken = async (req) => {
  return await UserModel.findOne({
    where: {
      reset_password_token: req.params.token,
    },
  });
};

const getByUserIds = async (user_ids) => {
  return await UserModel.findAll({
    where: {
      id: {
        [Op.in]: user_ids,
      },
    },
  });
};
const verifyCustomer = async (user_id) => {
  return await UserModel.update(
    { is_verified: true },
    {
      where: {
        id: user_id,
      },
      returning: true,
      raw: true,
    }
  );
};

export default {
  init: init,
  create: create,
  createCustomer: createCustomer,
  get: get,
  getById: getById,
  getByUsername: getByUsername,
  getByPhone: getByPhone,
  update: update,
  updatePassword: updatePassword,
  deleteById: deleteById,
  countUser: countUser,
  getByEmailId: getByEmailId,
  getByResetToken: getByResetToken,
  getByUserIds: getByUserIds,
  verifyCustomer: verifyCustomer,
};
