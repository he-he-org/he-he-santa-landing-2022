import { Handler } from "@netlify/functions";
import { Event } from "@netlify/functions/dist/function/event";
import {Context} from "@netlify/functions/dist/function/context";
import {Stripe} from "stripe"

const SUCCESS_URL = '/payment/success'
const CANCEL_URL = '/'

function oneTimePayment(amount: number, productId, host): Stripe.Checkout.SessionCreateParams {
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
    success_url: `${host}${SUCCESS_URL}`,
    cancel_url: `${host}${CANCEL_URL}`,
  }
}

function subscription(amount, productId, host): Stripe.Checkout.SessionCreateParams {
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
    success_url: `${host}${SUCCESS_URL}`,
    cancel_url: `${host}${CANCEL_URL}`,
  }
}


const handler: Handler = async (event: Event, context: Context) => {
  const PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;
  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;

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

    const stripeInstance = new Stripe(SECRET_KEY, {
      apiVersion: "2020-08-27",
    })
    const sessionParams: Stripe.Checkout.SessionCreateParams = mode === 'subscription'
      ? subscription(parseInt(amount), PRODUCT_ID, process.env.DEPLOY_URL)
      : oneTimePayment(parseInt(amount), PRODUCT_ID, process.env.DEPLOY_URL);
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
