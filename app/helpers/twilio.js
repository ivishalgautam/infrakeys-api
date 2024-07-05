const accountSid = "AC9290510b6496d85128f09ff46ac9c84f";
const authToken = "70db6de328f52b311ccb1306f5c9a8d3";
import twilio from "twilio";
const client = twilio(accountSid, authToken);

export const sendTwilioOTP = ({ phone, name, otp }) => {
  return client.messages
    .create({
      from: "+12294045304",
      to: `+91${phone}`,
      body: `
      Hi ${name},

Your OTP is ${otp}. For your security, do not share this with anyone.`,
    })
    .then((verification_check) => console.log(verification_check.status));
};
