"use strict";

import axios from "axios";
import config from "../config/index.js";

export async function sendOtp({ country_code = "+91", phone, name, otp }) {
  let configs = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.interakt.ai/v1/public/message/",
    headers: {
      Authorization: `Basic ${config.interakt_api_key}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      countryCode: country_code,
      phoneNumber: phone,
      callbackuserData: "Otp sent successfully.",
      type: "Template",
      template: {
        name: config.interakt_template_name,
        languageCode: "en",
        bodyValues: [name ?? "name", "OTP", otp],
      },
    }),
  };

  const resp = await axios(configs);
  console.log(resp.data);
  return resp;
}

export async function sendEnquiry({
  country_code = "+91",
  adminPhone = "8130376622",
  customerName,
  productName,
  enquiryFor,
}) {
  let configs = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.interakt.ai/v1/public/message/",
    headers: {
      Authorization: `Basic ${config.interakt_api_key}`,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      countryCode: country_code,
      phoneNumber: adminPhone,
      callbackuserData: "Enquiry sent successfully.",
      type: "Template",
      template: {
        name: config.interakt_enq_template_name,
        languageCode: "en",
        bodyValues: [customerName, enquiryFor, productName],
      },
    }),
  };

  const resp = await axios(configs);
  console.log(resp.data);
  return resp;
}
