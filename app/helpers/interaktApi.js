"use strict";

import axios from "axios";
import config from "../config/index.js";

export async function sendOtp({ country_code = "+91", phone, name, otp }) {
  // let config = {
  //   method: "get",
  //   maxBodyLength: Infinity,
  //   url: `https://app.wafly.in/api/sendtemplate.php?LicenseNumber=97288548722&APIKey=${process.env.INTERACT_API_KEY}&Contact=${country_code}${phone}&Template=${process.env.INTERACT_TEMPLATE_NAME}&Param=${name},OTP,${otp}`,
  //   headers: {},
  // };

  let axiosConfig = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://pgapi.smartping.ai/fe/api/v1/send?username=${config.smartping_username}&password=${config.smartping_password}&unicode=false&from=INFKEY&to=${phone}&text=Your%20OTP%20for%20Infrakeys%20is%20${otp}.%20It%20is%20valid%20for%205%20minutes.%20Please%20do%20not%20share%20this%20OTP%20with%20anyone&dltContentId=${config.smartping_content_id}`,
    headers: { }
  };

  axios
    .request(axiosConfig)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
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
