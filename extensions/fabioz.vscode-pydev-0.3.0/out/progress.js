"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class ProgressReporter {
    constructor() {
        this.level = 0;
    }
    start() {
        this.level += 1;
        if (this.level == 1) {
            vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Window }, p => {
                this.progress = p;
                this.promise = new Promise((resolve, reject) => {
                    this.resolve = resolve;
                });
                return this.promise;
            });
        }
    }
    message(msg) {
        if (this.progress) {
            this.progress.report({ message: 'PyDev: ' + msg });
        }
    }
    end() {
        this.level -= 1;
        if (this.level == 0) {
            if (this.resolve) {
                this.resolve();
                this.resolve = undefined;
                this.promise = undefined;
                this.progress = undefined;
            }
        }
    }
}
exports.ProgressReporter = ProgressReporter;
//# sourceMappingURL=progress.js.map