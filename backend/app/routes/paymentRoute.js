const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  const { role } = req.body;

  // Define pricing per role
  const rolePricing = {
    team_owner: 50000, 
    admin: 100000      
  };

  if (!rolePricing[role]) {
    return res.status(400).json({ error: 'No payment required for this role' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: rolePricing[role],
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).send('Payment initiation failed');
  }
});

module.exports = router;