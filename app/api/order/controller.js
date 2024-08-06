"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { generateOrderId } from "../../helpers/generateId.js";
import { updatedEnquiryItems } from "../../helpers/enquiry-item.js";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  try {
    const orderId = generateOrderId();
    const order = await table.OrderModel.create({
      order_id: orderId,
      user_id: req.body.user_id ?? req.user_data.id,
    });

    if (order) {
      req.body?.items.forEach(
        async ({ _id: tempCartProductId, product_id, quantity }) => {
          const newOrder = await table.OrderItemModel.create({
            order_id: order.id,
            product_id,
            quantity,
          });

          if (newOrder) {
            await table.CartModel.deleteById(req, tempCartProductId);
          }
        }
      );
    }

    res.send({ status: true, message: "Enquiry sent." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const updateById = async (req, res) => {
  try {
    const record = await table.OrderModel.getById(req.params.id);
    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Order not found!" });
    }

    if (record?.status === "delivered")
      return res.code(BAD_REQUEST).send({
        status: false,
        message: "Order delivered no changes allowed!",
      });

    const data = await table.OrderModel.update(req, req.params.id);

    if (data && req.body.items) {
      const updatedItems = updatedEnquiryItems(req.body.items);
      updatedItems.forEach(async (item) => {
        await table.OrderItemModel.update(item, item._id);
      });
    }

    // update points
    if (
      data.status === "in_transit" &&
      data?.payment_method === "channel_financing"
    ) {
      const creditRecord = await table.PointsModel.getByUserId(data?.user_id);
      let points = parseInt(creditRecord.points) - parseInt(data.order_amount);
      await table.PointsModel.update({ body: { points } }, creditRecord.id);
    }

    res.send({ status: true, message: "Updated" });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const getById = async (req, res) => {
  try {
    const record = await table.OrderModel.getById(req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "order not found!" });
    }

    const data = {
      ...record,
      items:
        record.items.length === 1 &&
        Object.values(record.items[0]).every((item) => item === null)
          ? []
          : record.items,
    };

    res.send({ status: true, data: data });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const get = async (req, res) => {
  try {
    const data = await table.OrderModel.get(req);
    res.send({ status: true, data: data });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteById = async (req, res) => {
  try {
    const record = await table.OrderModel.deleteById(req, req.params.id);

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "order not found!" });

    res.send({ status: true, message: "order deleted." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteOrderItemById = async (req, res) => {
  try {
    const record = await table.OrderItemModel.getById(
      req,
      req.params.order_item_id
    );

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "order item not found!" });

    await table.OrderItemModel.deleteById(req, req.params.order_item_id);
    res.send({ status: true, message: "order item deleted.", data: record });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getById: getById,
  deleteOrderItemById: deleteOrderItemById,
};
