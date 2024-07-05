import axios from "axios";

export const sendFast2SmsOtp = () => {
  const options = {
    headers: {
      authorization:
        "UjtrY9lOAx0L3dgaPBSINDMhJ6RWnXGvKZsoQFi4bTCzEpc7ukGZpM4oTuw0tLJq8DgCnkv5mifcKI19",
    },
  };

  const data = {
    message: "This is a test message",
    language: "english",
    route: "q",
    numbers: "7011691802",
  };

  return axios
    .post("https://www.fast2sms.com/dev/bulkV2", data, options)
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error(error);
    });
};

export const sendSarvOtp = () => {
  const data = {
    token: "FiPMxpxIn17K4T0J43433LiO14bG6pnCN3OBiBJM3GWxZ",
    user_id: "70037606",
    route: "ROUTE",
    language: "eng", // Note: This should likely be "language" instead of "languge"
    template_id: "T_ID",
    template: "Hello user this is an transactional message to alert you.",
    sender_id: "70037606",
    contact_numbers: "7011691802",
  };

  axios
    .post(
      "http://manage.sarvsms.com/api/send_general_sms.php?username=70037606&msg_token=FiPMxpxIn17K4T0J43433LiO14bG6pnCN3OBiBJM3GWxZ&message=hello&mobile=7011691802"
    )
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};
