import "server-only";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const url = process.env.WC_API_URL;
const consumerKey = process.env.WC_CONSUMER_KEY;
const consumerSecret = process.env.WC_CONSUMER_SECRET;

export const wooCommerce =
  url && consumerKey && consumerSecret
    ? new WooCommerceRestApi({
        url,
        consumerKey,
        consumerSecret,
        version: "wc/v3",
        queryStringAuth: false
      })
    : null;
