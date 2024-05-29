"use strict";

import hash from "../../lib/encryption/index.js";

import table from "../../db/models.js";
import authToken from "../../helpers/auth.js";
import crypto from "crypto";
import { sendOtp } from "../../helpers/interaktApi.js";
import moment from "moment";

const verifyUserCredentials = async (req, res) => {
  let userData;
  try {
    userData = await table.UserModel.getByUsername(req);

    if (!userData) {
      return res.code(404).send({ message: "User not found!" });
    }

    // ! remove false
    if (false && !userData.is_active) {
      return res
        .code(400)
        .send({ message: "User not active. Please contact administrator!" });
    }

    let passwordIsValid = await hash.verify(
      req.body.password,
      userData.password
    );

    if (!passwordIsValid) {
      return res.code(400).send({
        message: "Invalid credentials",
      });
    }

    const [jwtToken, expiresIn] = authToken.generateAccessToken(userData);
    const refreshToken = authToken.generateRefreshToken(userData);

    return res.send({
      status: true,
      token: jwtToken,
      expire_time: Date.now() + expiresIn,
      refresh_token: refreshToken,
      user_data: userData,
    });
  } catch (error) {
    console.log(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const createNewUser = async (req, res) => {
  try {
    const record = await table.UserModel.getByUsername(req);

    if (record) {
      return res.code(409).send({
        status: false,
        message:
          "User already exists with username. Please try with different username",
      });
    }

    return res.send({ status: true, data: await table.UserModel.create(req) });
  } catch (error) {
    console.log(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const verifyCustomer = async (req, res) => {
  try {
    const record = await table.UserModel.getByPhone(req);

    if (!record) {
      return res.code(404).send({ message: "Customer not found!" });
    }

    if (!record.is_active)
      return res
        .code(400)
        .send({ message: "Please contact administrator for login!" });

    const otp = crypto.randomInt(100000, 999999);
    // const otp = 111111;
    // console.log({ otp });

    if (record) {
      await table.OtpModel.create({
        user_id: record.id,
        otp: otp,
      });

      await sendOtp({ name: record?.phone, phone: record.phone, otp });
    }

    return res.send({ status: true, message: "Otp sent." });
  } catch (error) {
    console.log(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const createNewCustomer = async (req, res) => {
  try {
    const record = await table.UserModel.getByPhone(req);

    if (record) {
      return res.code(400).send({ message: "Customer exist!" });
    }

    const userData = await table.UserModel.createCustomer(req);
    const otp = crypto.randomInt(100000, 999999);
    // const otp = 111111;
    // console.log({ otp });

    if (userData) {
      await table.OtpModel.create({
        user_id: userData.id,
        otp: otp,
      });

      await sendOtp({ name: record?.phone, phone: record.phone, otp });
    }

    return res.send({ status: true });
  } catch (error) {
    console.log(error);
    return res.code(500).send({ status: false, message: error.message, error });
  }
};

const verifyRefreshToken = async (req, res) => {
  return authToken.verifyRefreshToken(req, res);
};

const createOtp = async (req, res) => {
  try {
    const user = await table.UserModel.getByPhone(req);
    const otp = crypto.randomInt(100000, 999999);
    const record = await table.OtpModel.getByUserId(user?.id);

    if (record) {
      await table.OtpModel.update({ user_id: user?.id, otp: otp });
      await sendOtp({ name: user?.name, phone: user.phone, otp });
    } else {
      await table.OtpModel.create({ user_id: user?.id, otp: otp });
      await sendOtp({ name: user?.name, phone: user.phone, otp });
    }

    res.send({ status: true, message: "Otp sent" });
  } catch (error) {
    console.error(error);
    res.code(500).send({ status: false, message: error.message, error });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const user = await table.UserModel.getByPhone(req);
    const record = await table.OtpModel.getByUserId(user.id);

    if (!record) {
      return res.code(404).send({ message: "OTP not found!" });
    }

    const isExpired = moment(record.created_at).add(5, "minutes").isBefore();
    if (isExpired) {
      await table.OtpModel.deleteByUserId(user.id);
      return res
        .code(400)
        .send({ status: false, message: "Please resend OTP!" });
    }

    if (record.otp != req.body.otp) {
      return res.code(400).send({ status: false, message: "Incorrect otp!" });
    }

    await table.OtpModel.deleteByUserId(user.id);

    const [jwtToken, expiresIn] = authToken.generateAccessToken(user);
    const refreshToken = authToken.generateRefreshToken(user);

    await table.UserModel.verifyCustomer(user.id);

    res.send({
      status: true,
      token: jwtToken,
      expire_time: Date.now() + expiresIn,
      refresh_token: refreshToken,
      user_data: user,
    });
  } catch (error) {
    console.error(error);
    res.code(500).send({ status: false, message: error.message, error });
  }
};

export default {
  verifyUserCredentials: verifyUserCredentials,
  verifyCustomer: verifyCustomer,
  createNewUser: createNewUser,
  createNewCustomer: createNewCustomer,
  verifyRefreshToken: verifyRefreshToken,
  createOtp: createOtp,
  verifyOtp: verifyOtp,
};
