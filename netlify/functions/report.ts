import {Handler} from "@netlify/functions";
import {Event} from "@netlify/functions/dist/function/event";
import {Context} from "@netlify/functions/dist/function/context";

import {Stripe} from "stripe"

const envSettings = require("./envSettings.json")

function toCsv(json: unknown[]): string {
  if (json.length === 0) {
    return '';
  }

  const keys = Object.keys(json[0]);

  let result = keys.map(key => `"${key.replace(/"/g, `""`)}"`).join(',') + '\n';

  result += json.map((record) => {
    return keys.map(key => {
      const value = record[key] ?? "";
      if (value == null) {
        return value;
      } else if (typeof value === 'number') {
        return value;
      } else if (typeof value === 'string') {
        return `"${value.replace(/"/g, `""`)}"`;
      }
      throw new Error(`Data type not supported: ${typeof value}`)
    }).join(",");
  }).join('\n');

  return result;
}

async function downloadData(stripe: Stripe, startDate: Date) {
  console.log("Downloading sessions...")
  const sessionsIterator = stripe.checkout.sessions.list({
    limit: 100,
    expand: ["data.payment_intent", "data.line_items"],
  })

  const rawData = [];
  for await (const session of sessionsIterator) {
    if (session.payment_intent == null || typeof session.payment_intent !== "object") {
      continue;
    }
    const created = new Date(session.payment_intent.created * 1000);
    if (created < startDate) {
      break;
    }
    console.log(`Session by ${created.toISOString()}`)
    rawData.push(session)
  }
  console.log("Downloading finished...")
  return rawData;
}

const handler: Handler = async (event: Event, context: Context) => {
  try {
    const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const ENV = process.env.ENV === "development" ? "development" : "production";
    const ENV_SETTINGS = envSettings[ENV];
    const PRODUCT_IDS = ENV_SETTINGS.products.map(({ stripeId }) => stripeId)

    const stripe = new Stripe(SECRET_KEY, {
      apiVersion: "2020-08-27",
    });
    
    let startDate = new Date();
    if (event.queryStringParameters['start_date'] !== null) {
      const dateString = event.queryStringParameters['start_date'];
      const date = new Date(dateString)
      if (!Number.isNaN(date.getTime())) {
        startDate = date;
      }
    }

    let result = await downloadData(stripe, startDate);

    result = result.filter((session) => {
      if (session.status !== "complete") {
        return false;
      }
      if (session.payment_status !== "paid") {
        return false;
      }
      if (!session.line_items.data.some(item => PRODUCT_IDS.indexOf(item.price.product) !== -1)) {
        return false;
      }

      return true;
    })

    const csvData = result.map((session) => ({
      date: new Date(session.payment_intent.created * 1000).toISOString(),
      amount: session.amount_total / 100,
      description: session.line_items.data[0].description,
      product_id: session.line_items.data[0].price.product,
      subscription: session.subscription,
      customer_details: session.customer_details?.email,
    }))

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="secret-santa-report-${new Date().toISOString()}.csv"`
      },
      body: toCsv(csvData),
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
