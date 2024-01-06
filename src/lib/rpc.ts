import Link from 'grenache-nodejs-link';
import { PeerRPCClient, PeerRPCServer, PeerPub, PeerSub } from 'grenache-nodejs-ws';
import _ from 'lodash';
import WS from 'websocket';
import { EXCHANGE_NAME } from './consts';
import { IRequestPayload } from './interfaces';

export class RPCPeer {
  private _connectLine: string;
  private _port: number;
  private _host: string;
  private _instanceName: string;
  private _link: Link;

  public constructor(link: Link, connectLine: string) {
    this._connectLine = connectLine;
    this._port = Number(connectLine.split(':')[1]);
    this._host = connectLine.split(':')[0];
    this._instanceName = `${EXCHANGE_NAME}:${this._port}`;
    this._link = link;
  }

  public get instanceName() {
    return this._instanceName;
  }

  public get connectLine() {
    return this._connectLine;
  }

  public get host() {
    return this._host;
  }

  public get port() {
    return this._port;
  }

  public async isAvaiable() {
    const connChecker = new WS.client();
    return new Promise((resolve, reject) => {
      connChecker.on('connect', function (connection) {
        resolve(true);
      });
      connChecker.on('connectFailed', () => {
        resolve(false);
      });

      connChecker.connect(`ws://${this.connectLine}`, null, null, null, { timeout: 1000 });
    });
  }

  public async sendMessage(payload: IRequestPayload) {
    const isAvaiable = await this.isAvaiable();
    if (isAvaiable) {
      return new Promise((resolve, reject) => {
        const peer = new PeerRPCClient(this._link, {});
        peer.init();

        peer.request(this.instanceName, payload, { timeout: 1000 }, (err, result) => {
          if (err) {
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    } else {
      return Promise.resolve(false);
    }
  }
}
