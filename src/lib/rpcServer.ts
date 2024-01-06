import crypto from 'node:crypto';
import Link from 'grenache-nodejs-link';
import { PeerRPCClient, PeerRPCServer, PeerPub, PeerSub } from 'grenache-nodejs-ws';
import _, { set } from 'lodash';
import { ANNOUNCE_COMMANDS, COIN, EXCHANGE_NAME } from './consts';
import {
  ERequestType,
  IOrder,
  IRequestPayload,
  IRequestPayloadWithoutSender,
  IResponsePayloadWithoutSender,
  OrderType,
} from './interfaces';
import { RPCPeer } from './rpc';

export class RPCServer {
  private _link: Link;
  private _server: PeerRPCServer;
  private _port: number;
  private _peersStorage: RPCPeer[] = [];
  private _id: string;
  private _orderBook: IOrder[] = [];

  public constructor(link) {
    this._link = link;
    this._id = crypto.randomUUID();
    console.debug(`This server id: ${this._id}`);
    this.refreshRPCList();
  }

  public get port() {
    return this._port;
  }

  private async processRequest(request: IRequestPayload): Promise<IResponsePayloadWithoutSender> {
    // console.debug(`Process request: ${JSON.stringify(request)}`);
    switch (request.type) {
      case ERequestType.order_announce: {
        const requestedOrder: IOrder = request.data.order;
        if (requestedOrder.type === 'buy') {
          const sellOrders = this._orderBook.filter(
            (o) => o.type === 'sell' && o.coin === requestedOrder.coin && o.status === 'open',
          );
          const matchOrder = sellOrders.find((o) => o.price <= requestedOrder.price);
          if (matchOrder) {
            console.log(`Order matched: ${JSON.stringify(requestedOrder)} <-> ${JSON.stringify(matchOrder)}`);
            matchOrder.status = 'accepting';
            return {
              type: ERequestType.order_match,
              data: {
                recipient: request.sender,
                order: matchOrder,
                matchId: requestedOrder.id,
              },
            };
          }
        }
        if (requestedOrder.type === 'sell') {
          const buyOrders = this._orderBook.filter(
            (o) => o.type === 'buy' && o.coin === requestedOrder.coin && o.status === 'open',
          );
          const matchOrder = buyOrders.find((o) => o.price >= requestedOrder.price);
          if (matchOrder) {
            console.log(`Order matched: ${JSON.stringify(requestedOrder)} <-> ${JSON.stringify(matchOrder)}`);
            matchOrder.status = 'accepting';
            return {
              type: ERequestType.order_match,
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
      case ERequestType.order_match: {
        if (request.data.recipient === this._id) {
          const requestedOrder: IOrder = request.data.order;
          const matchedOrder = this._orderBook.find((o) => o.id === request.data.matchId && o.status === 'open');
          if (matchedOrder) {
            console.log(`Order match: ${JSON.stringify(requestedOrder)}`);
            matchedOrder.status = 'accepting';
            return {
              type: ERequestType.order_accepted,
              data: {
                recipient: request.sender,
                order: matchedOrder,
                matchId: requestedOrder.id,
              },
            };
          } else {
            console.log(`Order match rejected: ${JSON.stringify(requestedOrder)}`);
            return {
              type: ERequestType.order_rejected,
              data: {
                recipient: request.sender,
                matchId: requestedOrder.id,
              },
            };
          }
        }
        break;
      }
      case ERequestType.order_accepted: {
        if (request.data.recipient === this._id) {
          const requestedOrder: IOrder = request.data.order;
          const matchedOrder = this._orderBook.find((o) => o.id === request.data.matchId && o.status === 'accepting');
          if (matchedOrder) {
            console.log(`Order accepted: ${JSON.stringify(requestedOrder)}`);
            matchedOrder.status = 'closed';
            return {
              type: ERequestType.order_closed,
              data: {
                recipient: request.sender,
                order: matchedOrder,
                matchId: requestedOrder.id,
              },
            };
          } else {
            console.log(`Order accepted rejected: ${JSON.stringify(requestedOrder)}`);
            return {
              type: ERequestType.order_rejected,
              data: {
                recipient: request.sender,
                matchId: requestedOrder.id,
              },
            };
          }
        }
        break;
      }
      case ERequestType.order_closed: {
        if (request.data.recipient === this._id) {
          const requestedOrder: IOrder = request.data.order;
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
      case ERequestType.order_rejected: {
        if (request.data.recipient === this._id) {
          const requestedOrder: IOrder = request.data.order;
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

  public async start(port?: number, interval = 10000) {
    if (!port) {
      port = _.random(10000, 11000);
    }
    this._port = port;
    const peer = new PeerRPCServer(this._link, {});
    peer.init();

    this._server = peer.transport('server');
    this._server.listen(port);

    const instanceName = `${EXCHANGE_NAME}:${this._port}`;

    setInterval(() => {
      this._link.announce(instanceName, this._port, {});
    }, 1000);

    this._server.on('request', async (rid, key, payload: IRequestPayload, handler) => {
      /** @todo Self requests processing */
      if (payload.sender === this._id) {
        return;
      }
      try {
        const result = await this.processRequest(payload);
        if (result) {
          void this.makeAnnouncement(result);
        }
      } catch (err) {
        handler.reply(err);
      }
    });

    // Init announcement
    this._link.startAnnouncing(
      ANNOUNCE_COMMANDS.started,
      port,
      {
        interval,
      },
      (err) => {
        if (err) {
          throw err;
        }
      },
    );

    // Add itself to list
    await this.checkAndAddPeer(`127.0.0.1:${this._port}`);
    this.printPeers();

    return this;
  }

  public makeAnnouncement = async (data: IRequestPayloadWithoutSender) => {
    const payload: IRequestPayload = {
      ...data,
      sender: this._id,
    };
    await Promise.all(
      this._peersStorage
        /** @todo Remove itself from list */
        .filter((peer) => peer.port !== this.port)
        .map(async (peer) => {
          try {
            await peer.sendMessage(payload);
            console.debug(`Sent ${JSON.stringify(data)} to ${peer.instanceName}`);
          } catch (err) {
            console.info(`Cant send ${JSON.stringify(data)} to ${peer.instanceName}`);
          }
        }),
    );
  };

  public refreshRPCList() {
    this._link.lookup(ANNOUNCE_COMMANDS.started, {}, async (err, _peers: string[] = []) => {
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

  private async checkAndAddPeer(connectLine: string) {
    // eslint-disable-next-line arrow-body-style
    const isExists = this._peersStorage.find((p) => {
      return p.connectLine === connectLine;
    });
    if (!isExists) {
      const peer = new RPCPeer(this._link, connectLine);
      if (await peer.isAvaiable()) {
        this._peersStorage.push(peer);
      }
    }
  }

  private printPeers() {
    const output = this._peersStorage.map((p) => p.connectLine).join(', ');
    console.log(`Peers available: ${output}`);
    return output;
  }

  private async createOrder(coin: COIN, type: OrderType, price: number) {
    const order: IOrder = {
      id: crypto.randomUUID(),
      coin,
      type,
      price,
      status: 'open',
    };
    this._orderBook.push(order);
    await this.makeAnnouncement({
      type: ERequestType.order_announce,
      data: {
        order,
      },
    });
    console.log(`Order created: ${JSON.stringify(order)}`);
  }

  /**
   * High level methods
   */
  public runRandomExchangeScenario(creationTimeout = 8000) {
    console.log(`Run random exchange with creation timeout ${creationTimeout}ms`);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      const coin: COIN = _.sample(Object.values(COIN));
      const type: OrderType = _.sample(['buy', 'sell']);
      const price = _.random(100, 120);
      await this.createOrder(coin, type, price);
    }, creationTimeout);
  }
}
