import axios from "axios";

export const sendMsg91OTP = async () => {
  var options = {
    method: "POST",
    url: "https://control.msg91.com/api/v5/flow",
    headers: {
      authkey: process.env.MSG91_AUTH_KEY,
      accept: "application/json",
      "content-type": "application/json",
    },
    data: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobiles: process.env.MSG91_MOBILE,
      VAR1: "vishal",
      VAR2: "123456",
    }),
  };

  return await axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
};
