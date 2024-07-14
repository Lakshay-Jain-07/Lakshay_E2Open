"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Log {
    constructor(outputChannelName) {
        this.outputChannel = vscode.window.createOutputChannel(outputChannelName);
    }
    debug(msg) {
        this.log(msg, 'DEBUG');
    }
    info(msg) {
        this.log(msg, 'INFO');
    }
    warn(msg) {
        this.log(msg, 'WARN');
    }
    error(msg) {
        this.log(msg, 'ERROR');
    }
    dispose() {
        this.outputChannel.dispose();
    }
    log(msg, logLevel) {
        const dateString = new Date().toISOString().replace('T', ' ').replace('Z', '');
        this.outputChannel.appendLine(`[${dateString}] [${logLevel}] ${msg}`);
    }
}
exports.Log = Log;
//# sourceMappingURL=log.js.map