const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { sendBanNotificationEmail, sendNewTicketEmail } = require('./emailService'); // assuming these exist

const emailWorker = new Worker('emailQueue', async job => {
  const { type, data } = job.data;
  console.log(`[Worker] Procesando job ${job.id} de tipo ${type}`);

  if (type === 'ban_notification') {
    await sendBanNotificationEmail(data.email, data.reason, data.until);
  } else if (type === 'new_ticket') {
    await sendNewTicketEmail(data.email, data.ticketId);
  }
  // Add other email types here
  
}, { connection });

emailWorker.on('completed', job => {
  console.log(`[Worker] Job ${job.id} completado con éxito`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} falló:`, err.message);
});

module.exports = emailWorker;
