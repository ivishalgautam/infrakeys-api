import axios from "axios";

export const sendMsg91OTP = async () => {
  var options = {
    method: "POST",
    url: "https://control.msg91.com/api/v5/flow",
    headers: {
      authkey: "425680Ap11EHcbjbZ668684ebP1",
      accept: "application/json",
      "content-type": "application/json",
    },
    data: JSON.stringify({
      template_id: "668659d8d6fc054a2f54bc92",
      mobiles: "917011691802",
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
