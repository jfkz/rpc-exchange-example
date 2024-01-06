"use strict";
const nodeCrypto = require("node:crypto");
const grenacheWs = require("grenache-nodejs-ws");
const _ = require("lodash");
const rpcClient = require("./rpc");

class RPCServer {
    constructor(link) {
        this._peersStorage = [];
        this._orderBook = [];
        this.makeAnnouncement = async (data) => {
            const payload = {
                ...data,
                sender: this._id,
            };
            await Promise.all(this._peersStorage
                /** @todo Remove itself from list */
                .filter((peer) => peer.port !== this.port)
                .map(async (peer) => {
                try {
                    await peer.sendMessage(payload);
                    console.debug(`Sent ${JSON.stringify(data)} to ${peer.instanceName}`);
                }
                catch (err) {
                    console.info(`Cant send ${JSON.stringify(data)} to ${peer.instanceName}`);
                }
            }));
        };
        this._link = link;
        this._id = nodeCrypto.randomUUID();
        console.debug(`This server id: ${this._id}`);
        this.refreshRPCList();
    }
    get port() {
        return this._port;
    }
    async processRequest(request) {
        // console.debug(`Process request: ${JSON.stringify(request)}`);
        switch (request.type) {
            case 'order_announce': {
                const requestedOrder = request.data.order;
                if (requestedOrder.type === 'buy') {
                    const sellOrders = this._orderBook.filter((o) => o.type === 'sell' && o.coin === requestedOrder.coin && o.status === 'open');
                    const matchOrder = sellOrders.find((o) => o.price <= requestedOrder.price);
                    if (matchOrder) {
                        console.log(`Order matched: ${JSON.stringify(requestedOrder)} <-> ${JSON.stringify(matchOrder)}`);
                        matchOrder.status = 'accepting';
                        return {
                            type: 'order_match',
                            data: {
                                recipient: request.sender,
                                order: matchOrder,
                                matchId: requestedOrder.id,
                            },
                        };
                    }
                }
                if (requestedOrder.type === 'sell') {
                    const buyOrders = this._orderBook.filter((o) => o.type === 'buy' && o.coin === requestedOrder.coin && o.status === 'open');
                    const matchOrder = buyOrders.find((o) => o.price >= requestedOrder.price);
                    if (matchOrder) {
                        console.log(`Order matched: ${JSON.stringify(requestedOrder)} <-> ${JSON.stringify(matchOrder)}`);
                        matchOrder.status = 'accepting';
                        return {
                            type: 'order_match',
                            data: {
                                recipient: request.sender,
                                order: matchOrder,
                                matchId: requestedOrder.id,
                            },
                        };
                    }
                }
                break;
            }
            case 'order_match': {
                if (request.data.recipient === this._id) {
                    const requestedOrder = request.data.order;
                    const matchedOrder = this._orderBook.find((o) => o.id === request.data.matchId && o.status === 'open');
                    if (matchedOrder) {
                        console.log(`Order match: ${JSON.stringify(requestedOrder)}`);
                        matchedOrder.status = 'accepting';
                        return {
                            type: 'order_accepted',
                            data: {
                                recipient: request.sender,
                                order: matchedOrder,
                                matchId: requestedOrder.id,
                            },
                        };
                    }
                    else {
                        console.log(`Order match rejected: ${JSON.stringify(requestedOrder)}`);
                        return {
                            type: 'order_rejected',
                            data: {
                                recipient: request.sender,
                                matchId: requestedOrder.id,
                            },
                        };
                    }
                }
                break;
            }
            case 'order_accepted': {
                if (request.data.recipient === this._id) {
                    const requestedOrder = request.data.order;
                    const matchedOrder = this._orderBook.find((o) => o.id === request.data.matchId && o.status === 'accepting');
                    if (matchedOrder) {
                        console.log(`Order accepted: ${JSON.stringify(requestedOrder)}`);
                        matchedOrder.status = 'closed';
                        return {
                            type: 'order_closed',
                            data: {
                                recipient: request.sender,
                                order: matchedOrder,
                                matchId: requestedOrder.id,
                            },
                        };
                    }
                    else {
                        console.log(`Order accepted rejected: ${JSON.stringify(requestedOrder)}`);
                        return {
                            type: 'order_rejected',
                            data: {
                                recipient: request.sender,
                                matchId: requestedOrder.id,
                            },
                        };
                    }
                }
                break;
            }
            case 'order_closed': {
                if (request.data.recipient === this._id) {
                    const requestedOrder = request.data.order;
                    const matchedOrder = this._orderBook.find((o) => o.id === request.data.matchId && o.status === 'accepting');
                    if (matchedOrder) {
                        console.log(`Order closed: ${JSON.stringify(requestedOrder)}`);
                        matchedOrder.status = 'closed';
                        let remainingCoins = 0;
                        if (matchedOrder.type === 'sell') {
                            remainingCoins = requestedOrder.price - matchedOrder.price;
                            if (remainingCoins > 0) {
                                console.log(`Remaining coins: ${matchedOrder.coin} ${remainingCoins}`);
                                await this.createOrder(matchedOrder.coin, matchedOrder.type, remainingCoins);
                            }
                        }
                    }
                    return null;
                }
                break;
            }
            case 'order_rejected': {
                if (request.data.recipient === this._id) {
                    const requestedOrder = request.data.order;
                    const matchedOrder = this._orderBook.find((o) => o.id === request.data.matchId && o.status === 'accepting');
                    if (matchedOrder) {
                        console.log(`Order rejected: ${JSON.stringify(requestedOrder)}`);
                        matchedOrder.status = 'open';
                        return null;
                    }
                }
                break;
            }
        }
        return null;
    }
    async start(port, interval = 10000) {
        if (!port) {
            port = _.random(10000, 11000);
        }
        this._port = port;
        const peer = new grenacheWs.PeerRPCServer(this._link, {});
        peer.init();
        this._server = peer.transport('server');
        this._server.listen(port);
        const instanceName = `exchange_worker:${this._port}`;
        setInterval(() => {
            this._link.announce(instanceName, this._port, {});
        }, 1000);
        this._server.on('request', async (rid, key, payload, handler) => {
            /** @todo Self requests processing */
            if (payload.sender === this._id) {
                return;
            }
            try {
                const result = await this.processRequest(payload);
                if (result) {
                    void this.makeAnnouncement(result);
                }
            }
            catch (err) {
                handler.reply(err);
            }
        });
        // Init announcement
        this._link.startAnnouncing("started" /* ANNOUNCE_COMMANDS.started */, port, {
            interval,
        }, (err) => {
            if (err) {
                throw err;
            }
        });
        // Add itself to list
        await this.checkAndAddPeer(`127.0.0.1:${this._port}`);
        this.printPeers();
        return this;
    }
    refreshRPCList() {
        this._link.lookup("started" /* ANNOUNCE_COMMANDS.started */, {}, async (err, _peers = []) => {
            if (err) {
                /** @todo dont ignore all errors but not for now */
                return false;
                throw err;
            }
            for await (const connectionLine of _peers) {
                await this.checkAndAddPeer(connectionLine);
            }
            this.printPeers();
        });
    }
    async checkAndAddPeer(connectLine) {
        // eslint-disable-next-line arrow-body-style
        const isExists = this._peersStorage.find((p) => {
            return p.connectLine === connectLine;
        });
        if (!isExists) {
            const peer = new rpcClient.RPCPeer(this._link, connectLine);
            if (await peer.isAvaiable()) {
                this._peersStorage.push(peer);
            }
        }
    }
    printPeers() {
        const output = this._peersStorage.map((p) => p.connectLine).join(', ');
        console.log(`Peers available: ${output}`);
        return output;
    }
    async createOrder(coin, type, price) {
        const order = {
            id: nodeCrypto.randomUUID(),
            coin,
            type,
            price,
            status: 'open',
        };
        this._orderBook.push(order);
        await this.makeAnnouncement({
            type: 'order_announce',
            data: {
                order,
            },
        });
        console.log(`Order created: ${JSON.stringify(order)}`);
    }
    /**
     * High level methods
     */
    runRandomExchangeScenario(creationTimeout = 8000) {
        console.log(`Run random exchange with creation timeout ${creationTimeout}ms`);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setInterval(async () => {
            const coin = _.sample(['BTC', 'ETH', 'LTC', 'XRP', 'BCH', 'EOS', 'BNB', 'XTZ', 'LINK', 'XLM']);
            const type = _.sample(['buy', 'sell']);
            const price = _.random(100, 120);
            await this.createOrder(coin, type, price);
        }, creationTimeout);
    }
}
exports.RPCServer = RPCServer;
