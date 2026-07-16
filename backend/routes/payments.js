const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const { plan } = req.body; // 'monthly' o 'lifetime'
  
  if (!plan || (plan !== 'monthly' && plan !== 'lifetime')) {
    return res.status(400).json({ error: 'Plan inválido' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe no está configurado en el servidor' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    let priceId;
    let mode;

    if (plan === 'monthly') {
      priceId = process.env.STRIPE_PRICE_MONTHLY;
      mode = 'subscription';
    } else {
      priceId = process.env.STRIPE_PRICE_LIFETIME;
      mode = 'payment';
    }

    if (!priceId) {
      return res.status(500).json({ error: 'El ID del precio de Stripe no está configurado' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app?payment=success&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/app?payment=cancelled`,
      customer_email: user.email,
      client_reference_id: user.id.toString(),
      metadata: {
        userId: user.id.toString(),
        plan: plan
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear sesión de pago' });
  }
});

// Webhook para recibir eventos de Stripe
// ¡IMPORTANTE! Express necesita recibir esto en crudo (raw buffer), no parseado como JSON.
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // FIX: Removed insecure fallback that accepted unverified payloads.
  // If no webhook secret is configured, reject the request immediately.
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = parseInt(session.client_reference_id || session.metadata?.userId);
      const plan = session.metadata?.plan;

      if (userId && !isNaN(userId)) {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumPlan: plan,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription || null
          }
        });
        console.log(`Usuario ${userId} actualizado a plan ${plan} correctamente.`);
        
        // Send async payment success email (must await in Vercel serverless)
        await emailService.sendPaymentSuccessEmail(updatedUser, plan).catch(console.error);
        
      } else {
        console.error(`Webhook: userId inválido recibido: ${session.client_reference_id}`);
      }
    } else if (event.type === 'customer.subscription.deleted') {
       // Manejar cancelación de suscripción
       const subscription = event.data.object;
       const user = await prisma.user.findFirst({
         where: { stripeSubscriptionId: subscription.id }
       });
       if (user) {
         await prisma.user.update({
           where: { id: user.id },
           data: {
             isPremium: false,
             premiumPlan: null,
             stripeSubscriptionId: null
           }
         });
         console.log(`Suscripción cancelada para el usuario ${user.id}`);
       }
    }
  } catch (err) {
    // FIX: Return 500 so Stripe retries delivery if DB update fails
    console.error('Error procesando el evento de Stripe:', err);
    return res.status(500).send('Error procesando el evento');
  }

  res.json({received: true});
});

module.exports = router;
