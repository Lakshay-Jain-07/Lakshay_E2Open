"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode = require("vscode");
class GuestSessionManager {
    constructor(context, testHub, sharedServiceProxy, log) {
        this.testHub = testHub;
        this.sharedServiceProxy = sharedServiceProxy;
        this.log = log;
        this.adapterProxies = new Map();
        sharedServiceProxy.onNotify('registerAdapter', (args) => {
            this.log.info(`Received registerAdapter notification: ${JSON.stringify(args)}`);
            const adapterId = args.adapterId;
            const proxy = new TestAdapterProxy(adapterId, sharedServiceProxy, this.log);
            this.adapterProxies.set(adapterId, proxy);
            this.testHub.registerTestAdapter(proxy);
        });
        sharedServiceProxy.onNotify('unregisterAdapter', (args) => {
            this.log.info(`Received unregisterAdapter notification: ${JSON.stringify(args)}`);
            const adapterId = args.adapterId;
            const proxy = this.adapterProxies.get(adapterId);
            if (proxy) {
                this.testHub.unregisterTestAdapter(proxy);
                this.adapterProxies.delete(adapterId);
            }
            else {
                this.log.warn('Tried to unregister unknown adapter');
            }
        });
        sharedServiceProxy.onNotify('tests', (args) => {
            this.log.debug(`Received TestLoad event for adapter #${args.adapterId}: ${JSON.stringify(args.event)}`);
            const proxy = this.adapterProxies.get(args.adapterId);
            if (proxy) {
                proxy.testsEmitter.fire(args.event);
            }
            else {
                this.log.warn('The TestLoad event was sent by an unknown adapter');
            }
        });
        sharedServiceProxy.onNotify('testState', (args) => {
            this.log.debug(`Received TestRun event for adapter #${args.adapterId}: ${JSON.stringify(args.event)}`);
            const proxy = this.adapterProxies.get(args.adapterId);
            if (proxy) {
                proxy.testStatesEmitter.fire(args.event);
            }
            else {
                this.log.warn('The TestRun event was sent by an unknown adapter');
            }
        });
        if (sharedServiceProxy.isServiceAvailable) {
            this.startSession();
        }
        context.subscriptions.push(sharedServiceProxy.onDidChangeIsServiceAvailable(available => {
            available ? this.startSession() : this.endSession();
        }));
    }
    startSession() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.log.info('Starting Guest session');
            const initialAdapters = yield this.sharedServiceProxy.request('adapters', []);
            this.log.info(`Received adapters response: ${JSON.stringify(initialAdapters)}`);
            for (const adapter of initialAdapters) {
                const proxy = new TestAdapterProxy(adapter.adapterId, this.sharedServiceProxy, this.log);
                this.adapterProxies.set(adapter.adapterId, proxy);
                this.testHub.registerTestAdapter(proxy);
                proxy.ignoreLoadRequests = false;
                proxy.testsEmitter.fire({ type: 'started' });
                if (adapter.hasOwnProperty('tests')) {
                    proxy.testsEmitter.fire({ type: 'finished', suite: adapter.tests || undefined });
                }
            }
        });
    }
    endSession() {
        this.adapterProxies.forEach(proxy => {
            this.testHub.unregisterTestAdapter(proxy);
        });
        this.adapterProxies.clear();
        this.log.info('Guest session finished');
    }
}
exports.GuestSessionManager = GuestSessionManager;
class TestAdapterProxy {
    constructor(adapterId, sharedService, log) {
        this.adapterId = adapterId;
        this.sharedService = sharedService;
        this.log = log;
        this.testsEmitter = new vscode.EventEmitter();
        this.testStatesEmitter = new vscode.EventEmitter();
        this.ignoreLoadRequests = true;
    }
    load() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.ignoreLoadRequests) {
                this.log.debug(`Ignoring load request for adapter #${this.adapterId}`);
            }
            else {
                this.log.debug(`Passing on load request for adapter #${this.adapterId}`);
                return this.sharedService.request('load', [this.adapterId]);
            }
        });
    }
    run(tests) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Passing on run request for adapter #${this.adapterId}`);
            return this.sharedService.request('run', [this.adapterId, tests]);
        });
    }
    debug(tests) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Passing on debug request for adapter #${this.adapterId}`);
            return this.sharedService.request('debug', [this.adapterId, tests]);
        });
    }
    cancel() {
        this.log.debug(`Passing on cancel request for adapter #${this.adapterId}`);
        this.sharedService.request('cancel', [this.adapterId]);
    }
    get tests() {
        return this.testsEmitter.event;
    }
    get testStates() {
        return this.testStatesEmitter.event;
    }
}
//# sourceMappingURL=guestSession.js.map