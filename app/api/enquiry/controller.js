"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import {
  generateEnquiryId,
  generateOrderId,
} from "../../helpers/generateId.js";
import { updatedEnquiryItems } from "../../helpers/enquiry-item.js";
import { sendEnquiry } from "../../helpers/interaktApi.js";

const { INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  try {
    const enquiryId = generateEnquiryId(req.body.enquiry_type);

    const enquiry = await table.EnquiryModel.create(req, enquiryId);

    if (enquiry) {
      req.body?.items.forEach(async (item) => {
        req.body = {
          ...req.body,
          ...item,
          enquiry_id: enquiryId,
        };

        const newOrder = await table.EnquiryItemModel.create(req);

        if (newOrder) {
          //? _id is a cart item id and it is inside req.body.items array
          await table.CartModel.deleteById(req, item._id);
        }
      });
    }

    if (req.body.payment_method === "channel_financing") {
      const user = await table.UserModel.getById(req, req.user_data.id);
      req.body.channel_financing = "initiated";
      !user.channel_financing &&
        (await table.UserModel.update(req, req.user_data.id));
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
    const record = await table.EnquiryModel.getById(req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Enquiry not found!" });
    }

    if (record.is_converted_to_order) {
      return res.code(400).send({
        status: false,
        message: "Enquiry converted to order no changes allowed!",
      });
    }

    const data = await table.EnquiryModel.update(req, req.params.id);

    if (data && req.body.items) {
      const updatedItems = updatedEnquiryItems(req.body?.items);
      let orderAmt = 0;

      updatedItems?.forEach(async (item, ind) => {
        const { base_rate, quantity, gst_percentage } = item;
        const totalAmt = base_rate
          ? (parseInt(gst_percentage) * (100 / parseInt(base_rate)) +
              parseInt(base_rate)) *
            parseInt(quantity)
          : 0;

        orderAmt += totalAmt;
        if (item.status === "pending" || item.status === "not_available") {
          Object.assign(req.body, {
            ...item,
          });
        } else {
          Object.assign(req.body, {
            ...item,
            total_amount: parseFloat(totalAmt).toFixed(2),
          });
        }
        await table.EnquiryItemModel.update(req, item._id);
      });

      req.body = { order_amount: parseFloat(orderAmt).toFixed(2) };
      await table.EnquiryModel.update(req, req.params.id);
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
    const record = await table.EnquiryModel.getById(req.params.id);

    if (!record) {
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Enquiry not found!" });
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
    const data = await table.EnquiryModel.get(req);
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
    const record = await table.EnquiryModel.deleteById(req, req.params.id);

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Enquiry not found!" });
    res.send({ status: true, message: "Enquiry deleted." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const convertToOrder = async (req, res) => {
  try {
    const record = await table.EnquiryModel.getById(req.params.id);
    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Enquiry not found!" });

    if (record?.is_converted_to_order)
      return res.code(400).send({ message: "Already converted to order!" });

    const shouldConvertToOrder = record.items
      .map((item) => item.status)
      .some((ele) => ele === "partially_available" || ele === "available");

    if (!shouldConvertToOrder)
      return res
        .code(400)
        .send({ message: "This enquiry cannot coverted be to order." });

    const orderId =
      record?.id?.replace("ENQ", "ORD") ||
      generateOrderId(record?.enquiry_type);

    const order = await table.OrderModel.create({
      data: {
        order_id: orderId,
        user_id: record?.user_id,
        po_number: record?.po_number,
        po_file: record?.po_file,
        pincode: record?.pincode,
        delivery_summary: record?.delivery_summary,
        order_amount: record?.order_amount,
        payment_method: record?.payment_method,
        assigned_to: record?.assigned_to,
      },
    });

    if (order) {
      // update enquiry after coverted to order
      req.body.is_converted_to_order = true;
      req.body.status = "closed";
      await table.EnquiryModel.update(req, req.params.id);
      delete req.body.is_converted_to_order;
      delete req.body.status;
    }
    record.items.forEach(async (item) => {
      const { status, available_quantity, quantity } = item;
      if (status === "partially_available" || status === "available") {
        const data = {
          ...item,
          quantity:
            status === "partially_available" ? available_quantity : quantity,
        };
        await table.OrderItemModel.create(data, order.id);
      }
    });

    res.send({ status: true, message: "Enquiry converted to order." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const deleteEnquiryItemById = async (req, res) => {
  try {
    const record = await table.EnquiryItemModel.getById(
      req,
      req.params.enquiry_item_id
    );

    if (!record)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Enquiry item not found!" });

    await table.EnquiryItemModel.deleteById(req, req.params.enquiry_item_id);

    const enquiryRecord = await table.EnquiryModel.getById(record?.enquiry_id);

    await table.EnquiryModel.update(
      {
        body: {
          order_amount: record.total_amount
            ? enquiryRecord.order_amount - record.total_amount
            : enquiryRecord.order_amount,
        },
      },
      enquiryRecord.id
    );

    res.send({ status: true, message: "Enquiry item deleted.", data: record });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const sendEnquiryToWhatsApp = async (req, res) => {
  try {
    const customer = await table.UserModel.getById(req, req.user_data.id);

    if (!customer)
      return res.code(401).send({ status: false, message: "unauthorized" });

    const product = await table.ProductModel.getById(
      req,
      req.params.product_id
    );

    if (!product)
      return res
        .code(NOT_FOUND)
        .send({ status: false, message: "Product not found!" });

    console.log(product);

    sendEnquiry({
      adminPhone: "7011691802",
      customerName:
        String(customer.name).charAt(0).toUpperCase() +
        String(customer.name).slice(1),
      productName: String(product.title).toUpperCase(),
      enquiryFor: String(req.body.enqFor).toUpperCase(),
    });

    res.send({ message: "Enquiry sent on whatsapp." });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

export default {
  create: create,
  updateById: updateById,
  deleteById: deleteById,
  get: get,
  getById: getById,
  deleteEnquiryItemById: deleteEnquiryItemById,
  convertToOrder: convertToOrder,
  sendEnquiryToWhatsApp: sendEnquiryToWhatsApp,
};
