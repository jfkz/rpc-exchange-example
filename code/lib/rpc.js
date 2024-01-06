"use strict";
const grenacheWs = require("grenache-nodejs-ws");
const ws = require("websocket");
class RPCPeer {
    constructor(link, connectLine) {
        this._connectLine = connectLine;
        this._port = Number(connectLine.split(':')[1]);
        this._host = connectLine.split(':')[0];
        this._instanceName = `exchange_worker:${this._port}`;
        this._link = link;
    }
    get instanceName() {
        return this._instanceName;
    }
    get connectLine() {
        return this._connectLine;
    }
    get host() {
        return this._host;
    }
    get port() {
        return this._port;
    }
    async isAvaiable() {
        const connChecker = new ws.client();
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
    async sendMessage(payload) {
        const isAvaiable = await this.isAvaiable();
        if (isAvaiable) {
            return new Promise((resolve, reject) => {
                const peer = new grenacheWs.PeerRPCClient(this._link, {});
                peer.init();
                peer.request(this.instanceName, payload, { timeout: 1000 }, (err, result) => {
                    if (err) {
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
        }
        else {
            return Promise.resolve(false);
        }
    }
}
exports.RPCPeer = RPCPeer;
