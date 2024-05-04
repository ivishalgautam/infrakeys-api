export const updatedEnquiryItems = (items) => {
  return items.map((item) => {
    const percentage = Math.floor(
      item?.available_quantity * (100 / item?.quantity)
    );

    switch (item.status) {
      case "pending":
      case "not_available":
        return {
          ...item,
          base_rate: null,
          gst_percentage: null,
          pending_percentage: 100,
          in_transit_percentage: 0,
          delivered_percentage: 0,
        };
        break;

      case "in_transit":
        return {
          ...item,
          pending_percentage: 100 - percentage,
          in_transit_percentage: percentage,
          delivered_percentage: 0,
        };
        break;

      case "delivered":
        return {
          ...item,
          pending_percentage: 0,
          in_transit_percentage: 0,
          delivered_percentage: 100,
        };
        break;

      default:
        return item;
    }
  });
};
