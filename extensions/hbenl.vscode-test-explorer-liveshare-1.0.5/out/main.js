"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const vscode = require("vscode");
const vscode_test_adapter_api_1 = require("vscode-test-adapter-api");
const vsls = require("vsls/vscode");
const log_1 = require("./log");
const hostSession_1 = require("./hostSession");
const guestSession_1 = require("./guestSession");
exports.serviceName = 'test-explorer';
function activate(context) {
    activateAsync(context);
}
exports.activate = activate;
function activateAsync(context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const log = new log_1.Log('Test Explorer Live Share');
        log.info('Looking for Test Explorer');
        const testExplorerExtension = vscode.extensions.getExtension(vscode_test_adapter_api_1.testExplorerExtensionId);
        const testHub = testExplorerExtension ? testExplorerExtension.exports : undefined;
        log.info(`Test Hub ${testHub ? '' : 'not '}found`);
        if (!testHub)
            return;
        log.info('Looking for VSLS');
        const liveShare = yield vsls.getApiAsync();
        log.info(`VSLS ${liveShare ? '' : 'not '}found`);
        if (!liveShare)
            return;
        log.info('Trying to create shared service');
        const sharedService = yield liveShare.shareService(exports.serviceName);
        log.info(`Shared service ${sharedService ? '' : 'not '}created`);
        if (!sharedService) {
            vscode.window.showErrorMessage('Could not create a shared service. You have to set "liveshare.features" to "experimental" in your user settings in order to use this extension.');
            return;
        }
        log.info('Trying to get shared service proxy');
        const sharedServiceProxy = yield liveShare.getSharedService(exports.serviceName);
        log.info(`Shared service proxy ${sharedServiceProxy ? '' : 'not '}found`);
        if (!sharedServiceProxy) {
            vscode.window.showErrorMessage('Could not access a shared service. You have to set "liveshare.features" to "experimental" in your user settings in order to use this extension.');
            return;
        }
        new hostSession_1.HostSessionManager(context, testHub, liveShare, sharedService, log);
        new guestSession_1.GuestSessionManager(context, testHub, sharedServiceProxy, log);
        context.subscriptions.push({ dispose() { liveShare.unshareService(exports.serviceName); } });
    });
}
//# sourceMappingURL=main.js.map