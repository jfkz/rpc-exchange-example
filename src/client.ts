import 'dotenv/config';

import Link from 'grenache-nodejs-link';
import _ from 'lodash';
import { GRAPE_URI } from './lib/consts';
import { RPCServer } from './lib/rpcServer';

const link = new Link({
  grape: GRAPE_URI,
});
link.start();

void (async () => {
  const server = await new RPCServer(link).start();
  console.log(`This port: ${server.port}`);
  setInterval(() => {
    server.refreshRPCList();
  }, 5000);
  const thisTimeout = _.random(5, 15);
  server.runRandomExchangeScenario(thisTimeout * 1000);
})();

process.on('exit', (code) => {
  link.stop();
  console.log(`Process exited with code: ${code}`);
});
