export function generateEnquiryId(type) {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 100);
  return `ENQ_${String(type).toUpperCase()}_${timestamp}${randomNum}`;
}
export function generateOrderId(type) {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 100);
  return `ORD_${String(type).toUpperCase()}_${timestamp}${randomNum}`;
}
