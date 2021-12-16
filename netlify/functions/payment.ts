import {Handler} from "@netlify/functions";
import {Event} from "@netlify/functions/dist/function/event";
import {Context} from "@netlify/functions/dist/function/context";
import {Stripe} from "stripe"

const envSettings = require("./envSettings.json")

const SUCCESS_URL = '/success'
const CANCEL_URL = '/'

function oneTimePayment(amount: number, productId: string, baseUrl: string, lang: string): Stripe.Checkout.SessionCreateParams {
  return {
    line_items: [
      {
        price_data: {
          currency: 'USD',
          product: productId,
          unit_amount: amount,
        },
        quantity: 1,
      },
      {},
    ],
    mode: 'payment',
    locale: lang as Stripe.Checkout.SessionCreateParams.Locale,
    success_url: `${baseUrl}${SUCCESS_URL}`,
    cancel_url: `${baseUrl}${CANCEL_URL}`,
  }
}

function subscription(amount: number, productId: string, baseUrl: string, lang: string): Stripe.Checkout.SessionCreateParams {
  return {
    line_items: [
      {
        price_data: {
          currency: 'USD',
          product: productId,
          unit_amount: amount,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
      {},
    ],
    mode: 'subscription',
    locale: lang as Stripe.Checkout.SessionCreateParams.Locale,
    success_url: `${baseUrl}${SUCCESS_URL}`,
    cancel_url: `${baseUrl}${CANCEL_URL}`,
  }
}


const handler: Handler = async (event: Event, context: Context) => {
  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const BASE_URL = process.env.BASE_URL;
  const LANGS = process.env.LANGS.split(",");
  const DEFAULT_LANG = process.env.DEFAULT_LANG;
  const ENV = process.env.ENV === "development" ? "development" : "production";

  const settings = envSettings[ENV];

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      console.error(e);
      return {
        statusCode: 400,
        body: `Unable to parse request body as JSON`
      }
    }
    const productKey = body.productKey;
    if (productKey == null || typeof productKey !== "string") {
      return {
        statusCode: 400,
        body: `'productKey' parameter is required`,
      };
    }

    const product = settings.products.find(x => x.key === productKey);
    if (product == null) {
      return {
        statusCode: 400,
        body: `Unable to find product by key "${productKey}"`,
      };
    }

    const amount = body.amount;
    if (amount == null || typeof amount !== "string" || !/^\d+$/.test(amount)) {
      return {
        statusCode: 400,
        body: `'amount' parameter is required and should be a string with money amount of USD cents`,
      };
    }
    const mode = body.mode;
    const SUPPORTED_MODES = ['payment', 'subscription'];
    if (mode == null || typeof mode !== "string" || SUPPORTED_MODES.indexOf(mode) === -1) {
      return {
        statusCode: 400,
        body: `'mode' parameter is required and should be in [${SUPPORTED_MODES.join()}]`,
      };
    }

    const lang = LANGS.indexOf(body.lang) !== -1 ? body.lang : DEFAULT_LANG;

    const stripeInstance = new Stripe(SECRET_KEY, {
      apiVersion: "2020-08-27",
    })
    const baseUrl = lang === DEFAULT_LANG ? BASE_URL : `${BASE_URL}/${lang}`;
    const sessionParams: Stripe.Checkout.SessionCreateParams = mode === 'subscription'
      ? subscription(parseInt(amount), product.stripeId, baseUrl, lang)
      : oneTimePayment(parseInt(amount), product.stripeId, baseUrl, lang);
    const session = await stripeInstance.checkout.sessions.create(sessionParams);
    return {
      statusCode: 200,
      body: JSON.stringify({
        location: session.url,
      }),
    };
  } catch (e) {
    console.log(e)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something has gone wrong on our side, sorry :(' }),
    };
  }
};

export { handler }
