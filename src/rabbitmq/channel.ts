import amqplib from 'amqplib';

const consume = null as amqplib.Channel | null;
const publish = null as amqplib.Channel | null;

export default {
  consume,
  publish,
};