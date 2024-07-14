"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const child_process_1 = require("child_process");
function activate(context) {
    var extension = new RunOnSaveExtension(context);
    extension.showOutputMessage();
    vscode.workspace.onDidChangeConfiguration(() => {
        let disposeStatus = extension.showStatusMessage('Run On Save: Reloading config.');
        extension.loadConfig();
        disposeStatus.dispose();
    });
    vscode.commands.registerCommand('extension.emeraldwalk.enableRunOnSave', () => {
        extension.isEnabled = true;
    });
    vscode.commands.registerCommand('extension.emeraldwalk.disableRunOnSave', () => {
        extension.isEnabled = false;
    });
    vscode.workspace.onDidSaveTextDocument((document) => {
        extension.runCommands(document);
    });
}
exports.activate = activate;
class RunOnSaveExtension {
    constructor(context) {
        this._context = context;
        this._outputChannel = vscode.window.createOutputChannel('Run On Save');
        this.loadConfig();
    }
    /** Recursive call to run commands. */
    _runCommands(commands, document) {
        if (commands.length) {
            var cfg = commands.shift();
            this.showOutputMessage(`*** cmd start: ${cfg.cmd}`);
            var child = child_process_1.exec(cfg.cmd, this._getExecOption(document));
            child.stdout.on('data', data => this._outputChannel.append(data));
            child.stderr.on('data', data => this._outputChannel.append(data));
            child.on('error', (e) => {
                this.showOutputMessage(e.message);
            });
            child.on('exit', (e) => {
                // if sync
                if (!cfg.isAsync) {
                    this._runCommands(commands, document);
                }
            });
            // if async, go ahead and run next command
            if (cfg.isAsync) {
                this._runCommands(commands, document);
            }
        }
        else {
            // NOTE: This technically just marks the end of commands starting.
            // There could still be asyc commands running.
            this.showStatusMessage('Run on Save done.');
        }
    }
    _getExecOption(document) {
        return {
            shell: this.shell,
            cwd: this._getWorkspaceFolderPath(document.uri),
        };
    }
    _getWorkspaceFolderPath(uri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        // NOTE: rootPath seems to be deprecated but seems like the best fallback so that
        // single project workspaces still work. If I come up with a better option, I'll change it.
        return workspaceFolder
            ? workspaceFolder.uri.fsPath
            : vscode.workspace.rootPath;
    }
    get isEnabled() {
        return !!this._context.globalState.get('isEnabled', true);
    }
    set isEnabled(value) {
        this._context.globalState.update('isEnabled', value);
        this.showOutputMessage();
    }
    get shell() {
        return this._config.shell;
    }
    get autoClearConsole() {
        return !!this._config.autoClearConsole;
    }
    get commands() {
        return this._config.commands || [];
    }
    loadConfig() {
        this._config = vscode.workspace.getConfiguration('emeraldwalk.runonsave');
    }
    /**
     * Show message in output channel
     */
    showOutputMessage(message) {
        message = message || `Run On Save ${this.isEnabled ? 'enabled' : 'disabled'}.`;
        this._outputChannel.appendLine(message);
    }
    /**
     * Show message in status bar and output channel.
     * Return a disposable to remove status bar message.
     */
    showStatusMessage(message) {
        this.showOutputMessage(message);
        return vscode.window.setStatusBarMessage(message);
    }
    runCommands(document) {
        if (this.autoClearConsole) {
            this._outputChannel.clear();
        }
        if (!this.isEnabled || this.commands.length === 0) {
            this.showOutputMessage();
            return;
        }
        var match = (pattern) => pattern && pattern.length > 0 && new RegExp(pattern).test(document.fileName);
        var commandConfigs = this.commands
            .filter(cfg => {
            var matchPattern = cfg.match || '';
            var negatePattern = cfg.notMatch || '';
            // if no match pattern was provided, or if match pattern succeeds
            var isMatch = matchPattern.length === 0 || match(matchPattern);
            // negation has to be explicitly provided
            var isNegate = negatePattern.length > 0 && match(negatePattern);
            // negation wins over match
            return !isNegate && isMatch;
        });
        if (commandConfigs.length === 0) {
            return;
        }
        this.showStatusMessage('Running on save commands...');
        // build our commands by replacing parameters with values
        const commands = [];
        for (const cfg of commandConfigs) {
            let cmdStr = cfg.cmd;
            const extName = path.extname(document.fileName);
            const workspaceFolderPath = this._getWorkspaceFolderPath(document.uri);
            const relativeFile = path.relative(workspaceFolderPath, document.uri.fsPath);
            cmdStr = cmdStr.replace(/\${file}/g, `${document.fileName}`);
            // DEPRECATED: workspaceFolder is more inline with vscode variables,
            // but leaving old version in place for any users already using it.
            cmdStr = cmdStr.replace(/\${workspaceRoot}/g, workspaceFolderPath);
            cmdStr = cmdStr.replace(/\${workspaceFolder}/g, workspaceFolderPath);
            cmdStr = cmdStr.replace(/\${fileBasename}/g, path.basename(document.fileName));
            cmdStr = cmdStr.replace(/\${fileDirname}/g, path.dirname(document.fileName));
            cmdStr = cmdStr.replace(/\${fileExtname}/g, extName);
            cmdStr = cmdStr.replace(/\${fileBasenameNoExt}/g, path.basename(document.fileName, extName));
            cmdStr = cmdStr.replace(/\${relativeFile}/g, relativeFile);
            cmdStr = cmdStr.replace(/\${cwd}/g, process.cwd());
            // replace environment variables ${env.Name}
            cmdStr = cmdStr.replace(/\${env\.([^}]+)}/g, (sub, envName) => {
                return process.env[envName];
            });
            commands.push({
                cmd: cmdStr,
                isAsync: !!cfg.isAsync
            });
        }
        this._runCommands(commands, document);
    }
}
//# sourceMappingURL=extension.js.map