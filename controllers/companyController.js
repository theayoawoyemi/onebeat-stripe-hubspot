const axios = require("axios");
const hubspot = require("@hubspot/api-client");

// Live
// const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
// const stripe = require("stripe")(STRIPE_SECRET_KEY);

// Live
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const hubspotClient = new hubspot.Client({
  accessToken: HUBSPOT_TOKEN,
});

async function getCompanyByOnebeatId(onebeatId) {
  try {
    const searchResponse = await hubspotClient.crm.companies.searchApi.doSearch(
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "onebeat_id__cloned_",
                operator: "EQ",
                value: onebeatId,
              },
            ],
          },
        ],
        properties: ["name", "domain", "onebeat_id__cloned_"],
        limit: 1,
      }
    );

    if (searchResponse.results.length > 0) {
      const company = searchResponse.results[0];
      return company;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error retrieving company from HubSpot:", err.message);
    throw err;
  }
}

async function getDealByOnebeatId(onebeatId) {
  try {
    const searchResponse = await hubspotClient.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "onebeatid", // your custom deal property
              operator: "EQ",
              value: onebeatId,
            },
          ],
        },
      ],
      properties: ["dealname", "amount", "onebeatid"], // adjust any other deal properties you need
      limit: 1,
    });

    if (searchResponse.results.length > 0) {
      const deal = searchResponse.results[0];
      return deal;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error retrieving deal from HubSpot:", err.message);
    throw err;
  }
}

async function getCustomObjectSchemas() {
  try {
    const response = await hubspotClient.crm.schemas.coreApi.getAll();
    const customObjects = response.results.filter(
      (schema) => schema.archived === false
    );

    const schema_name = "stripe_invoices";
    const stripe_invoices_schema = customObjects.find(
      (schema) => schema.name === schema_name
    );

    if (!stripe_invoices_schema) {
      throw new Error(`Custom object schema "${schema_name}" not found.`);
    }

    return stripe_invoices_schema;
  } catch (error) {
    console.error("Error fetching custom object schemas:", error.message);
    throw error;
  }
}

async function getStripeInvoiceByInvoiceId(invoice_id, objectType) {
  try {
    const searchResponse = await hubspotClient.crm.objects.searchApi.doSearch(
      objectType,
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "invoice_id",
                operator: "EQ",
                value: invoice_id,
              },
            ],
          },
        ],
        properties: [
          "hs_object_id",
          "onebeat_id",
          "invoice_number",
          "invoice_id",
        ],
        limit: 1,
      }
    );

    if (searchResponse.results.length > 0) {
      const stripeInvoice = searchResponse.results[0];
      return stripeInvoice;
    } else {
      console.log("No Stripe Invoice found with ID:", invoice_id);
      return null;
    }
  } catch (error) {
    console.error(
      "Error retrieving Stripe Invoice custom object:",
      error.message
    );
    throw error;
  }
}

// async function getStripeInvoiceByNumber(invoice_number, objectType) {
//   try {
//     const searchResponse = await hubspotClient.crm.objects.searchApi.doSearch(
//       objectType,
//       {
//         filterGroups: [
//           {
//             filters: [
//               {
//                 propertyName: "invoice_number",
//                 operator: "EQ",
//                 value: invoice_number,
//               },
//             ],
//           },
//         ],
//         properties: ["hs_object_id", "onebeat_id", "invoice_number"],
//         limit: 1,
//       }
//     );

//     if (searchResponse.results.length > 0) {
//       const stripeInvoice = searchResponse.results[0];
//       return stripeInvoice;
//     } else {
//       console.log("No Stripe Invoice found with Number:", invoice_number);
//       return null;
//     }
//   } catch (error) {
//     console.error(
//       "Error retrieving Stripe Invoice custom object:",
//       error.message
//     );
//     throw error;
//   }
// }

async function getStripeInvoicesByCompanyID(company_id, objectType) {
  try {
    const searchResponse = await hubspotClient.crm.objects.searchApi.doSearch(
      objectType,
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "company_id",
                operator: "EQ",
                value: company_id,
              },
            ],
          },
        ],
        properties: ["hs_object_id", "status", "company_id"],
        limit: 200,
      }
    );

    if (searchResponse.results.length > 0) {
      const stripeInvoices = searchResponse.results;
      return stripeInvoices;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "Error retrieving Stripe Invoice custom object:",
      error.message
    );
    throw error;
  }
}

async function updateCompanyNoOfUnpaidInvoices(company_id, object_type_id) {
  try {
    const invoices = await getStripeInvoicesByCompanyID(
      company_id,
      object_type_id
    );

    if (!invoices) throw new Error("Error getting invoices for the company");

    const unpaidInvoices = invoices.filter(
      (invoice) =>
        invoice.properties.status !== "paid" &&
        invoice.properties.status !== "void"
    );

    await hubspotClient.crm.companies.basicApi.update(company_id, {
      properties: {
        number_of_invoices_due_stripe: unpaidInvoices.length,
      },
    });

    return "Updated company unpaid invoices successfully";
  } catch (error) {
    console.error("Error updating company unpaid invoices:", error.message);
  }
}

exports.stripe = async (req, res, next) => {
  let event;

  try {
    // event = stripe.webhooks.constructEvent(
    //   req.body,
    //   req.headers["stripe-signature"],
    //   STRIPE_WEBHOOK_SECRET
    // );

    let parsedBody = req.body.toString("utf8");
    event = JSON.parse(parsedBody);

    // event = req.body;

    if (!event) throw new Error("Error getting event from stripe");

    const formatNumber = (num) => {
      let formatted;

      formatted = num / 100;

      // formatted = formatted.toLocaleString("en-US", {
      //   minimumFractionDigits: 2,
      //   maximumFractionDigits: 2,
      // });

      formatted = formatted.toFixed(2);

      return formatted;
    };

    const payload = {
      total: formatNumber(event.data.object.total),
      amount_remaining: formatNumber(event.data.object.amount_remaining),
      amount_paid: formatNumber(event.data.object.amount_paid),
      due_date: event.data.object.due_date,
      period_start: event.data.object.period_start,
      period_end: event.data.object.period_end,
      number: event.data.object.number,
      custom_fields: event.data.object.custom_fields,
      customer_email: event.data.object.customer_email,
      customer_name: event.data.object.customer_name,
      id: event.data.object.id,
      action: event.type,
      status: event.data.object.status,
      currency: event.data.object.currency,
    };

    let payloadValues = [];

    for (key in payload) payloadValues.push(payload[key]);
    if (!payloadValues.length)
      throw new Error("Error getting payload from event");

    // console.log(payload.action);

    if (!payload.number) payload.number = `DRAFT-${payload.id}`;
    // throw new Error("Invoice number not found in the event data");

    if (event.data.object?.subscription_details?.metadata) {
      payload.onebeat_id =
        event.data.object?.subscription_details?.metadata["Onebeat ID"] || null;
    } else if (event.data.object?.lines?.data[0]?.metadata) {
      payload.onebeat_id =
        event.data.object?.lines?.data[0]?.metadata["Onebeat ID"] || null;
    } else if (event.data.object?.metadata) {
      payload.onebeat_id = event.data.object?.metadata["Onebeat ID"] || null;
    }

    if (!payload.onebeat_id)
      throw new Error("Onebeat ID not found in the event metadata");

    const company = await getCompanyByOnebeatId(payload.onebeat_id);
    // const deal = await getDealByOnebeatId(payload.onebeat_id);

    if (!company?.id) throw new Error("Company not found in HubSpot");
    // if (!deal?.id) throw new Error("Deal not found in HubSpot");

    payload.company = company.id;
    // payload.deal = deal.id;

    // const eventTypes = [
    //   "invoice.created",
    //   "invoice.finalized",
    //   "invoice.sent",
    //   "invoice.updated",
    //   "invoice.paid",
    // ];

    console.log(payload);

    if (payload.action === "invoice.created") {
      try {
        // Test
        // const zapURL = "https://hooks.zapier.com/hooks/catch/11556657/u3kniew/";

        // Production
        const zapURL = "https://hooks.zapier.com/hooks/catch/11556657/umrmbpi/";
        const zapRes = await axios.post(zapURL, payload);
        if (zapRes.data.status !== "success")
          throw new Error(
            `Error sending invoice to Zapier - ${payload.action}`
          );

        (async () => {
          const schemas = await getCustomObjectSchemas();
          if (!schemas?.fullyQualifiedName) {
            throw new Error("Custom object schemas not found");
          }
          await updateCompanyNoOfUnpaidInvoices(
            payload.company,
            schemas.fullyQualifiedName
          );
        })();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    if (
      payload.action === "invoice.updated" ||
      payload.action === "invoice.paid" ||
      payload.action === "invoice.voided" ||
      payload.action === "invoice.sent"
    ) {
      try {
        // Run the function
        const schemas = await getCustomObjectSchemas();
        if (!schemas?.fullyQualifiedName) {
          throw new Error("Custom object schemas not found");
        }

        // const invoice = await getStripeInvoiceByNumber(
        //   payload.number,
        //   schemas.fullyQualifiedName
        // );

        const invoice = await getStripeInvoiceByInvoiceId(
          payload.id,
          schemas.fullyQualifiedName
        );

        if (!invoice?.id) {
          throw new Error(
            `Stripe Invoice with number ${payload.number} not found in HubSpot`
          );
        }
        payload.invoice_hs_id = invoice.id;

        // Test
        // const zapURL = "https://hooks.zapier.com/hooks/catch/11556657/uulftt4";

        // Production
        const zapURL = "https://hooks.zapier.com/hooks/catch/11556657/umrf2xl/";

        const zapRes = await axios.post(zapURL, payload);
        if (zapRes.data.status !== "success")
          throw new Error(
            `Error sending invoice to Zapier - ${payload.action}`
          );

        (async () => {
          await updateCompanyNoOfUnpaidInvoices(
            payload.company,
            schemas.fullyQualifiedName
          );
        })();
      } catch (error) {
        throw new Error(error.message);
      }
    }

    res.status(201).json({
      status: "success",
      message: "Syncing stripe",
      data: { payload },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
