"use strict";

import table from "../../db/models.js";
import hash from "../../lib/encryption/index.js";
import ejs from "ejs";
import fs from "fs";
import path from "path";
import { sendCredentials } from "../../helpers/mailer.js";
import { fileURLToPath } from "url";
import authToken from "../../helpers/auth.js";
import crypto from "crypto";
import { sendOtp } from "../../helpers/interaktApi.js";

const create = async (req, res) => {
  let record;
  try {
    if (req.body.role === "subadmin") {
      record = await table.UserModel.getByUsername(req);
      record = await table.UserModel.getByPhone(req);
    }

    if (req.body.role === "user") {
      record = await table.UserModel.getByPhone(req);
    }

    if (record) {
      return res.code(409).send({
        status: false,
        message: "User exist!",
      });
    }

    if (req.body.role === "subadmin") {
      await table.UserModel.create(req);
    }

    if (req.body.role === "user") {
      await table.UserModel.createCustomer(req);
    }

    return res.send({
      status: true,
      message: "User created",
    });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const update = async (req, res) => {
  try {
    const record = await table.UserModel.getById(req);
    if (!record) {
      return res.code(404).send({ status: false, message: "User not exists" });
    }

    const user = await table.UserModel.update(req);

    if (user && req.body.password) {
      req.body.new_password = req.body.password;
      await table.UserModel.updatePassword(req, req.user_data.id);
    }
    return res.send({ status: true, message: "Updated" });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.UserModel.deleteById(req);
    if (record === 0) {
      return res.code(404).send({ status: false, message: "User not exists" });
    }

    return res.send({ status: true, data: record });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    return res.send({ status: true, data: await table.UserModel.get(req) });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.UserModel.getById(req);
    if (!record) {
      return res.code(404).send({ status: false, message: "User not exists" });
    }
    delete record.password;

    return res.send({ status: true, data: record });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const updatePassword = async (req, res) => {
  try {
    const record = await table.UserModel.getById(req);

    if (!record) {
      return res.code(404).send({ status: false, message: "User not exists" });
    }

    const verify_old_password = await hash.verify(
      req.body.old_password,
      record.password
    );

    if (!verify_old_password) {
      return res
        .code(404)
        .send({ message: "Incorrect password. Please enter a valid password" });
    }

    await table.UserModel.updatePassword(req);
    return res.send({
      status: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const checkUsername = async (req, res) => {
  try {
    const user = await table.UserModel.getByUsername(req);
    if (user) {
      return res.code(409).send({
        status: false,
        message: "username already exists try with different username",
      });
    }
    return res.send({ status: true });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const getUser = async (req, res) => {
  try {
    const record = await table.UserModel.getById(undefined, req.user_data.id);
    if (!record) {
      return res.code(401).send({ status: false, messaege: "invalid token" });
    }

    return res.send(req.user_data);
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = await table.UserModel.getByResetToken(req);
    if (!token) {
      return res.code(401).send({ status: false, message: "invalid url" });
    }

    await table.UserModel.updatePassword(req, token.id);
    return res.send({
      status: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

export default {
  create: create,
  update: update,
  deleteById: deleteById,
  get: get,
  getById: getById,
  checkUsername: checkUsername,
  updatePassword: updatePassword,
  getUser: getUser,
  resetPassword: resetPassword,
};
