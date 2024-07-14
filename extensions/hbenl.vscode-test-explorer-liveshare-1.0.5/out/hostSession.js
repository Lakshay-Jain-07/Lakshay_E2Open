"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class HostSessionManager {
    constructor(context, testHub, liveShare, sharedService, log) {
        this.testHub = testHub;
        this.liveShare = liveShare;
        this.sharedService = sharedService;
        this.log = log;
        this.adapters = new Map();
        this.adapterSubscriptions = new Map();
        this.tests = new Map();
        this.nextAdapterId = 0;
        this.sharedService.onRequest('adapters', () => {
            this.log.debug('Received adapters request');
            const adapterIds = [...this.adapters.keys()];
            const response = adapterIds.map(adapterId => {
                if (this.tests.has(adapterId)) {
                    return { adapterId, tests: this.tests.get(adapterId) || null };
                }
                else {
                    return { adapterId };
                }
            });
            this.log.debug(`Sending adapters response: ${JSON.stringify(response)}`);
            return response;
        });
        this.sharedService.onRequest('load', (args) => {
            this.log.debug('Received load request...');
            return this.adapterRequest(args, adapter => adapter.load());
        });
        this.sharedService.onRequest('run', (args) => {
            this.log.debug('Received run request...');
            return this.adapterRequest(args, adapter => adapter.run(args[1]));
        });
        this.sharedService.onRequest('debug', (args) => {
            this.log.debug('Received debug request...');
            return this.adapterRequest(args, adapter => {
                if (adapter.debug)
                    adapter.debug(args[1]);
            });
        });
        this.sharedService.onRequest('cancel', (args) => {
            this.log.debug('Received cancel request...');
            this.adapterRequest(args, adapter => adapter.cancel());
        });
        if (sharedService.isServiceAvailable) {
            this.startSession();
        }
        context.subscriptions.push(sharedService.onDidChangeIsServiceAvailable(available => {
            available ? this.startSession() : this.endSession();
        }));
    }
    registerTestAdapter(adapter) {
        const adapterId = this.nextAdapterId++;
        this.log.info(`Registering Adapter #${adapterId}`);
        this.adapters.set(adapterId, adapter);
        const subscriptions = [];
        subscriptions.push(adapter.tests(event => {
            const convertedEvent = this.convertTestLoadEvent(event);
            if (convertedEvent.type === 'started') {
                this.tests.delete(adapterId);
            }
            else {
                this.tests.set(adapterId, convertedEvent.suite);
            }
            this.log.info(`Passing on TestLoad event for Adapter #${adapterId}: ${JSON.stringify(event)}`);
            this.sharedService.notify('tests', { adapterId, event: convertedEvent });
        }));
        subscriptions.push(adapter.testStates(event => {
            this.log.info(`Passing on TestRun event for Adapter #${adapterId}: ${JSON.stringify(event)}`);
            this.sharedService.notify('testState', { adapterId, event: this.convertTestRunEvent(event) });
        }));
        this.adapterSubscriptions.set(adapterId, subscriptions);
        this.sharedService.notify('registerAdapter', { adapterId });
    }
    unregisterTestAdapter(adapter) {
        for (const [adapterId, _adapter] of this.adapters) {
            if (_adapter === adapter) {
                this.log.info(`Unregistering Adapter #${adapterId}`);
                this.sharedService.notify('unregisterAdapter', { adapterId });
                const subscriptions = this.adapterSubscriptions.get(adapterId);
                if (subscriptions) {
                    subscriptions.forEach(subscription => subscription.dispose());
                }
                this.adapters.delete(adapterId);
                this.adapterSubscriptions.delete(adapterId);
                this.tests.delete(adapterId);
                return;
            }
        }
        this.log.warn('Tried to unregister unknown Adapter');
    }
    startSession() {
        this.log.info('Starting Host session');
        this.testHub.registerTestController(this);
    }
    endSession() {
        this.testHub.unregisterTestController(this);
        this.log.info('Host session finished');
    }
    adapterRequest(args, action) {
        const adapterId = args[0];
        const adapter = this.adapters.get(adapterId);
        if (adapter) {
            this.log.debug(`...for adapter #${adapterId}`);
            return action(adapter);
        }
        else {
            this.log.warn(`...for unknown adapter #${adapterId}`);
        }
        return undefined;
    }
    convertTestLoadEvent(event) {
        if ((event.type === 'finished') && (event.suite)) {
            return Object.assign({}, event, { suite: this.convertInfo(event.suite) });
        }
        else {
            return event;
        }
    }
    convertTestRunEvent(event) {
        if (event.type === 'started') {
            return Object.assign({}, event, { tests: event.tests });
        }
        else if ((event.type === 'suite') && (typeof event.suite === 'object')) {
            return Object.assign({}, event, { suite: this.convertInfo(event.suite) });
        }
        else if ((event.type === 'test') && (typeof event.test === 'object')) {
            return Object.assign({}, event, { test: this.convertInfo(event.test) });
        }
        else {
            return event;
        }
    }
    convertInfo(info) {
        let file = info.file;
        if (file) {
            try {
                file = this.liveShare.convertLocalUriToShared(vscode.Uri.file(file)).toString();
            }
            catch (e) {
                this.log.error(`Failed converting ${file} to shared URI: ${e}`);
            }
        }
        const children = (info.type === 'suite') ? info.children.map(child => this.convertInfo(child)) : undefined;
        return Object.assign({}, info, { file, children });
    }
}
exports.HostSessionManager = HostSessionManager;
//# sourceMappingURL=hostSession.js.map