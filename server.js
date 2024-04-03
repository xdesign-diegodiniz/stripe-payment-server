require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const app = express();

app.set("trust proxy", true);
app.use(express.json());

app.post("/create-intent", async (req, res) => {
  try {
    const customer = await stripe.customers.create({
      name: "Test Tester",
      email: "test@tester.com",
      // payment_method: paymentMethod.id,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2020-08-27" }
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      setupIntent: setupIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      // paymentMethod: paymentMethod.id,
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    res
      .status(500)
      .json({ error: "An error occurred while creating SetupIntent" });
  }
});

app.post("/payment-sheet", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    // if (customer) {
    //   customerId = await stripe.customers.retrieve(customer);
    //   customerPaymentMethod = await stripe.paymentMethods.attach(
    //     paymentMethod.id,
    //     {
    //       customer: customer.id,
    //     }
    //   );
    // } else {
    //   customerId = await stripe.customers.create();
    //   ephemeralKey = await stripe.ephemeralKeys.create(
    //     { customer: customerId.id },
    //     { apiVersion: "2020-08-27" }
    //   );

    //   paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount || 1099,
    //     currency: currency || "gbp",
    //     customer: customerId.id,
    //     payment_method: paymentMethod.id,
    //     setup_future_usage: "off_session",
    //   });
    // }

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: 2024,
        cvc: "123",
      },
    });

    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2020-08-27" }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 1099,
      currency: currency || "gbp",
      customer: customer.id,
      payment_method: paymentMethod.id,
      setup_future_usage: "off_session",
    });

    const customerPaymentMethod = await stripe.paymentMethods.attach(
      paymentMethod.id,
      {
        customer: customer.id,
      }
    );

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentMethod: paymentMethod.id,
      customerPaymentMethod: customerPaymentMethod,
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    res
      .status(500)
      .json({ error: "An error occurred while creating PaymentIntent" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
