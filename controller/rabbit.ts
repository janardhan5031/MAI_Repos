import amqp from "amqplib/callback_api";
import "dotenv/config"

const CONN_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}`;

let ch = null;
var queueName = process.env.RABBITMQ_QUEUE_NAME;

amqp.connect(
  CONN_URL,
  function (
    err: any,
    conn: { createChannel: (arg0: (err: any, channel: any) => void) => void }
  ) {
    conn.createChannel(function (err: any, channel: any) {
      ch = channel;

      ch.assertQueue(queueName, {
        durable: true,
      });

      ch.consume(queueName, async function (msg: { content: string }) {}, {
        noAck: true,
      });

      process.on("exit", (code) => {
        ch.close();
        console.log(`Closing rabbitmq channel`);
      });
    });
  }
);

export const publishToQueue = async (data: any) => {
  ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
};
