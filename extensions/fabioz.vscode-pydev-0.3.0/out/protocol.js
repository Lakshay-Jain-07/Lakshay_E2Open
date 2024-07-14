'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
/**
 * The message type. Copied from vscode protocol
 */
var MessageType;
(function (MessageType) {
    /**
     * An error message.
     */
    MessageType[MessageType["Error"] = 1] = "Error";
    /**
     * A warning message.
     */
    MessageType[MessageType["Warning"] = 2] = "Warning";
    /**
     * An information message.
     */
    MessageType[MessageType["Info"] = 3] = "Info";
    /**
     * A log message.
     */
    MessageType[MessageType["Log"] = 4] = "Log";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = new vscode_languageclient_1.NotificationType('language/status');
})(StatusNotification = exports.StatusNotification || (exports.StatusNotification = {}));
var ActionableNotification;
(function (ActionableNotification) {
    ActionableNotification.type = new vscode_languageclient_1.NotificationType('language/actionableNotification');
})(ActionableNotification = exports.ActionableNotification || (exports.ActionableNotification = {}));
var OpenFileNotification;
(function (OpenFileNotification) {
    OpenFileNotification.type = new vscode_languageclient_1.NotificationType('language/openFile');
})(OpenFileNotification = exports.OpenFileNotification || (exports.OpenFileNotification = {}));
var ChangeSelectionNotification;
(function (ChangeSelectionNotification) {
    ChangeSelectionNotification.type = new vscode_languageclient_1.NotificationType('language/changeSelection');
})(ChangeSelectionNotification = exports.ChangeSelectionNotification || (exports.ChangeSelectionNotification = {}));
//# sourceMappingURL=protocol.js.map