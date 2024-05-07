"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = constants.http.status;

const get = async (req, res) => {
  try {
    const products = await table.ProductModel.countProducts();
    // const total_categories = await table.CategoryModel.countCategories();
    const { total_orders } = await table.OrderModel.countOrders();
    const { total_enquiries } = await table.EnquiryModel.countEnquiries();

    res.send({
      status: true,
      data: { products, total_enquiries, total_orders },
    });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

const stats = async (req, res) => {
  try {
    const enquiries = await table.EnquiryModel.countEnquiriesStats();
    const orders = await table.OrderModel.countOrderStats();

    console.log({ enquiries, orders });

    res.send({
      status: true,
      data: { enquiries, orders },
    });
  } catch (error) {
    console.error(error);
    res
      .code(INTERNAL_SERVER_ERROR)
      .send({ status: false, message: error.message, error });
  }
};

export default {
  get: get,
  stats: stats,
};
