'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const progress_1 = require("./progress");
const vscode_languageclient_1 = require("vscode-languageclient");
const javaServerStarter_1 = require("./javaServerStarter");
const requirements_module = require("./requirements");
const commands_1 = require("./commands");
const protocol_1 = require("./protocol");
const settings_1 = require("./settings");
const fs = require("fs");
const pydevCommands = require("./pydevCommands");
const vscode = require("vscode");
let os = require('os');
let oldConfig;
let languageClient;
function activate(context) {
    return requirements_module.resolveRequirements().catch(error => {
        //show error
        vscode_1.window.showErrorMessage(error.message, error.label).then((selection) => {
            if (error.label && error.label === selection && error.openUrl) {
                vscode_1.commands.executeCommand(commands_1.Commands.OPEN_BROWSER, error.openUrl);
            }
        });
        // rethrow to disrupt the chain.
        throw error;
    }).then(requirements => {
        return vscode_1.window.withProgress({ location: vscode_1.ProgressLocation.Window }, p => {
            return new Promise((resolve, reject) => {
                let storagePath = context.storagePath;
                if (!storagePath) {
                    storagePath = getTempWorkspace();
                }
                let workspacePath = path.resolve(storagePath + '/pydev_ws');
                // Options to control the language client
                let clientOptions = {
                    // Register the server for python
                    documentSelector: ['python'],
                    synchronize: {
                        configurationSection: 'python',
                        // Notify the server about file changes to .py and project/build files contained in the workspace
                        fileEvents: [
                            vscode_1.workspace.createFileSystemWatcher('**/*.py'),
                            vscode_1.workspace.createFileSystemWatcher('**/.project'),
                            vscode_1.workspace.createFileSystemWatcher('**/.pydevproject'),
                        ],
                    },
                    initializationOptions: {
                        bundles: [],
                        workspaceFolders: vscode_1.workspace.workspaceFolders ? vscode_1.workspace.workspaceFolders.map(f => f.uri.toString()) : null
                    },
                    revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never
                };
                let statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, Number.MIN_VALUE);
                statusBarItem.text = 'PyDev';
                statusBarItem.command = pydevCommands.PYDEV_OPEN_OUTPUT;
                statusBarItem.tooltip = 'Click to open PyDev output log.';
                oldConfig = settings_1.getPyDevConfiguration();
                let serverOptions;
                let port = process.env['SERVER_PORT'];
                let args = null;
                if (!port) {
                    serverOptions = javaServerStarter_1.prepareExecutable(requirements, workspacePath, settings_1.getPyDevConfiguration());
                    args = serverOptions.args;
                }
                else {
                    // used during development
                    serverOptions = javaServerStarter_1.awaitServerConnection.bind(null, port);
                }
                let progressReporter = new progress_1.ProgressReporter();
                // Create the language client and start the client.
                languageClient = new vscode_languageclient_1.LanguageClient('python', 'PyDev: Language Support for Python', serverOptions, clientOptions);
                languageClient.registerProposedFeatures();
                languageClient.onReady().then(() => {
                    languageClient.outputChannel.appendLine('Workspace: ' + workspacePath);
                    languageClient.outputChannel.appendLine('Arguments: ' + args);
                    languageClient.onNotification(protocol_1.OpenFileNotification.type, (fileWithConfig) => {
                        if (fileWithConfig && fileWithConfig.file && fs.existsSync(fileWithConfig.file)) {
                            return vscode_1.workspace.openTextDocument(fileWithConfig.file)
                                .then(doc => {
                                if (!doc) {
                                    return false;
                                }
                                return vscode_1.window.showTextDocument(doc, vscode_1.window.activeTextEditor ?
                                    vscode_1.window.activeTextEditor.viewColumn : undefined)
                                    .then(editor => !!editor);
                            }, () => false)
                                .then(didOpen => {
                                if (!didOpen) {
                                    vscode_1.window.showWarningMessage('Could not open file: ' + fileWithConfig.file);
                                }
                                return didOpen;
                            });
                        }
                    });
                    languageClient.onNotification(protocol_1.ChangeSelectionNotification.type, (selection) => {
                        let activeTextEditor = vscode_1.window.activeTextEditor;
                        if (!activeTextEditor) {
                            console.log('This action requires an active text editor.');
                            return;
                        }
                        if (activeTextEditor.document.uri.toString() == selection.uri) {
                            let newSelection = new vscode.Selection(selection.startLine, selection.startCol, selection.endLine, selection.endCol);
                            activeTextEditor.selection = newSelection;
                            activeTextEditor.revealRange(newSelection);
                        }
                        else {
                            console.log('Text editor changed in the meanwhile: '
                                + activeTextEditor.document.uri.toString() + " != " + selection.uri);
                        }
                    });
                    languageClient.onNotification(protocol_1.StatusNotification.type, (report) => {
                        switch (report.type) {
                            case 'START_PROGRESS':
                                progressReporter.start();
                                progressReporter.message(report.message);
                                break;
                            case 'PROGRESS':
                                progressReporter.message(report.message);
                                break;
                            case 'END_PROGRESS':
                                progressReporter.end();
                                break;
                        }
                        statusBarItem.tooltip = report.message;
                        toggleItem(vscode_1.window.activeTextEditor, statusBarItem);
                    });
                    languageClient.onNotification(protocol_1.ActionableNotification.type, (notification) => {
                        let show = null;
                        switch (notification.severity) {
                            case protocol_1.MessageType.Log:
                                show = logNotification;
                                break;
                            case protocol_1.MessageType.Info:
                                show = vscode_1.window.showInformationMessage;
                                break;
                            case protocol_1.MessageType.Warning:
                                show = vscode_1.window.showWarningMessage;
                                break;
                            case protocol_1.MessageType.Error:
                                show = vscode_1.window.showErrorMessage;
                                break;
                        }
                        if (!show) {
                            return;
                        }
                        const titles = notification.commands.map(a => a.title);
                        show(notification.message, ...titles).then((selection) => {
                            for (let action of notification.commands) {
                                if (action.title === selection) {
                                    let args = (action.arguments) ? action.arguments : [];
                                    vscode_1.commands.executeCommand(action.command, ...args);
                                    break;
                                }
                            }
                        });
                    });
                });
                let disposable = languageClient.start();
                vscode_1.commands.registerCommand(pydevCommands.PYDEV_OPEN_SERVER_LOG, () => openServerLogFile(workspacePath));
                vscode_1.commands.registerCommand(pydevCommands.PYDEV_OPEN_OUTPUT, () => { languageClient.outputChannel.show(vscode_1.ViewColumn.Three); });
                vscode_1.commands.registerCommand(pydevCommands.PYDEV_EDITOR_PREV_METHOD_OR_CLASS, () => { prevMethodOrClass(); });
                vscode_1.commands.registerCommand(pydevCommands.PYDEV_EDITOR_NEXT_METHOD_OR_CLASS, () => { nextMethodOrClass(); });
                vscode_1.window.onDidChangeActiveTextEditor((editor) => { toggleItem(editor, statusBarItem); });
                // Push the disposable to the context's subscriptions so that the
                // client can be deactivated on extension deactivation
                context.subscriptions.push(disposable);
                context.subscriptions.push(onConfigurationChange());
                toggleItem(vscode_1.window.activeTextEditor, statusBarItem);
                // We need to resolve it here (don't wait for the language server to be ready, if it takes
                // more time it may be rejected and commands wouldn't be available).
                resolve(undefined);
            });
        });
    });
}
exports.activate = activate;
function nextOrPrev(commandId) {
    let activeTextEditor = vscode_1.window.activeTextEditor;
    if (!activeTextEditor) {
        console.log('This action requires an active text editor.');
        return;
    }
    let selection = activeTextEditor.selection;
    if (!selection) {
        console.log('This action requires an active selection.');
        return;
    }
    vscode_1.commands.executeCommand(commandId + '.internal', {
        'uri': activeTextEditor.document.uri.toString(),
        'startLine': selection.start.line,
        'startCol': selection.start.character,
        'endLine': selection.end.line,
        'endCol': selection.end.character,
    });
}
function prevMethodOrClass() {
    nextOrPrev(pydevCommands.PYDEV_EDITOR_PREV_METHOD_OR_CLASS);
}
function nextMethodOrClass() {
    nextOrPrev(pydevCommands.PYDEV_EDITOR_NEXT_METHOD_OR_CLASS);
}
function logNotification(message, ...items) {
    return new Promise((resolve, reject) => {
        console.log(message);
    });
}
function toggleItem(editor, statusBarItem) {
    if (editor && editor.document &&
        (editor.document.languageId === 'python')) {
        statusBarItem.show();
    }
    else {
        statusBarItem.hide();
    }
}
function onConfigurationChange() {
    return vscode_1.workspace.onDidChangeConfiguration(params => {
        let newConfig = settings_1.getPyDevConfiguration();
        if (hasJavaConfigChanged(oldConfig, newConfig)) {
            let msg = 'PyDev Language Server configuration changed, please restart VS Code.';
            let action = 'Restart Now';
            let restartId = commands_1.Commands.RELOAD_WINDOW;
            oldConfig = newConfig;
            vscode_1.window.showWarningMessage(msg, action).then((selection) => {
                if (action === selection) {
                    vscode_1.commands.executeCommand(restartId);
                }
            });
        }
    });
}
function hasJavaConfigChanged(oldConfig, newConfig) {
    return hasConfigKeyChanged(settings_1.JAVA_HOME, oldConfig, newConfig)
        || hasConfigKeyChanged(settings_1.LS_VMARGS, oldConfig, newConfig);
}
function hasConfigKeyChanged(key, oldConfig, newConfig) {
    return oldConfig.get(key) !== newConfig.get(key);
}
function getTempWorkspace() {
    return path.resolve(os.tmpdir(), 'vscode_pydev_ws_' + makeRandomHexString(5));
}
function makeRandomHexString(length) {
    let chars = ['0', '1', '2', '3', '4', '5', '6', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    let result = '';
    for (let i = 0; i < length; i++) {
        let idx = Math.floor(chars.length * Math.random());
        result += chars[idx];
    }
    return result;
}
function openServerLogFile(workspacePath) {
    let serverLogFile = path.join(workspacePath, '.metadata', '.log');
    if (!fs.existsSync(serverLogFile)) {
        return vscode_1.window.showWarningMessage('PyDev Language Server has not started logging.').then(() => false);
    }
    return vscode_1.workspace.openTextDocument(serverLogFile)
        .then(doc => {
        if (!doc) {
            return false;
        }
        return vscode_1.window.showTextDocument(doc, vscode_1.window.activeTextEditor ?
            vscode_1.window.activeTextEditor.viewColumn : undefined)
            .then(editor => !!editor);
    }, () => false)
        .then(didOpen => {
        if (!didOpen) {
            vscode_1.window.showWarningMessage('Could not open PyDev Language Server log file');
        }
        return didOpen;
    });
}
//# sourceMappingURL=extension.js.map