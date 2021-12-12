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
    console.error(e)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something has gone wrong on our side, sorry :(' }),
    };
  }



  // try {
  //   const response = await fetch(API_ENDPOINT);
  //   const data = await response.json();
  //   return { statusCode: 200, body: JSON.stringify({ data }) };
  // } catch (error) {
  //   console.log(error);
  //   return {
  //     statusCode: 500,
  //     body: JSON.stringify({ error: 'Failed fetching data' }),
  //   };
  // }
};
//
// const { readDotEnv } = require('./common.js');
// readDotEnv();
//
// const express = require('express');
// const app = express();
// console.log("process.env.STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY)
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
//
// const ONE_TIME_PAYMENT_PRICE_ID = "price_1K5AQGG6m2c66h5uxnRaU2fS";
// const SUBSCRIPTION_PRICE_ID = "price_1K2iItG6m2c66h5uTs2LL2P2";
// const SUCCESS_URL = 'https://example.com/success';
// const CANCEL_URL = 'https://example.com/cancel';
// const PRODUCT_ID = "prod_Ki8aptzSldBWjf";
//
// function oneTimePayment(amount) {
//   const inCents = Math.round(amount * 100);
//   return {
//     line_items: [
//       {
//         // price: ONE_TIME_PAYMENT_PRICE_ID,
//         price_data: {
//           currency: "USD",
//           product: PRODUCT_ID,
//           unit_amount: inCents,
//         },
//         quantity: 1,
//       },
//       {}
//     ],
//     mode: 'payment',
//     success_url: SUCCESS_URL,
//     cancel_url: CANCEL_URL,
//   }
// }
//
// function subscription(amount) {
//   const inCents = Math.round(amount * 100);
//   return {
//     line_items: [
//       {
//         // price: SUBSCRIPTION_PRICE_ID,
//         price_data: {
//           currency: "USD",
//           product: "prod_Ki8aptzSldBWjf",
//           unit_amount: inCents,
//           recurring: {
//             interval: "month",
//           },
//         },
//         quantity: 1,
//         // quantity: inCents,
//       },
//       {}
//     ],
//     mode: 'subscription',
//     success_url: SUCCESS_URL,
//     cancel_url: CANCEL_URL,
//   }
// }
//
// app.get('/create-checkout-session', async (req, res) => {
//   try {
//     // http://localhost:4242/create-checkout-session
//     const session = await stripe.checkout.sessions.create(oneTimePayment(3.42));
//     // const session = await stripe.checkout.sessions.create(subscription(3.42));
//
//     res.redirect(303, session.url);
//   } catch (e) {
//     console.error(e)
//     res.status(500).send(e.message ?? 'unknown error');
//   }
// });
//
// app.listen(4242, () => console.log(`Listening on port ${4242}!`));

export { handler }
