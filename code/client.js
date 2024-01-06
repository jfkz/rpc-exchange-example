"use strict";
require("dotenv/config");
const Link = require("grenache-nodejs-link");
const _ = require("lodash");
const exchangeServer = require("./lib/rpcServer");
const grapeUrl = process.env.GRAPE_URI || 'http://127.0.0.1:30001';
const link = new Link({
    grape: grapeUrl,
});
link.start();
void (async () => {
    const server = await new exchangeServer.RPCServer(link).start();
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
