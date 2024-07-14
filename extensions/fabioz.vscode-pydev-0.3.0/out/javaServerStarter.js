"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const net = require("net");
const glob = require('glob');
const DEBUG = (typeof v8debug === 'object') || startedInDebugMode();
function prepareExecutable(requirements, workspacePath, javaConfig) {
    let executable = Object.create(null);
    let options = Object.create(null);
    options.env = process.env;
    executable.options = options;
    executable.command = path.resolve(requirements.java_executable);
    executable.args = prepareParams(requirements, javaConfig, workspacePath);
    return executable;
}
exports.prepareExecutable = prepareExecutable;
function awaitServerConnection(port) {
    let addr = parseInt(port);
    return new Promise((res, rej) => {
        let server = net.createServer(stream => {
            server.close();
            console.log('PyDev LS connection established on port ' + addr);
            res({ reader: stream, writer: stream });
        });
        server.on('error', rej);
        server.listen(addr, () => {
            server.removeListener('error', rej);
            console.log('Awaiting PyDev LS connection on port ' + addr);
        });
        return server;
    });
}
exports.awaitServerConnection = awaitServerConnection;
function prepareParams(requirements, javaConfiguration, workspacePath) {
    let params = [];
    if (DEBUG) {
        params.push('-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=1044,quiet=y');
        // suspend=y is the default. Use this form if you need to debug the server startup code:
        //  params.push('-agentlib:jdwp=transport=dt_socket,server=y,address=1044');
    }
    if (requirements.java_version > 8) {
        params.push('--add-modules=ALL-SYSTEM');
        params.push('--add-opens');
        params.push('java.base/java.util=ALL-UNNAMED');
        params.push('--add-opens');
        params.push('java.base/java.lang=ALL-UNNAMED');
    }
    params.push('-Declipse.application=org.python.pydev.pydev_lsp.application');
    params.push('-Dosgi.bundles.defaultStartLevel=4');
    params.push('-Declipse.product=org.python.pydev.pydev_lsp.product');
    if (DEBUG) {
        params.push('-Dlog.protocol=true');
        params.push('-Dlog.level=ALL');
    }
    let SERVER_HOME_EXPORTED = process.env['SERVER_HOME_EXPORTED'];
    let vmargs = javaConfiguration.get('ls.vmargs', '');
    parseVMargs(params, vmargs);
    let server_home;
    if (SERVER_HOME_EXPORTED) {
        server_home = SERVER_HOME_EXPORTED;
    }
    else {
        server_home = path.resolve(__dirname, '../server');
    }
    let launchersFound = glob.sync('**/plugins/org.eclipse.equinox.launcher_*.jar', { cwd: server_home });
    if (launchersFound.length) {
        params.push('-jar');
        params.push(path.resolve(server_home, launchersFound[0]));
    }
    else {
        console.log('Unable to find equinox launcher under: ' + server_home);
        return null;
    }
    //select configuration directory according to OS
    let configDir;
    if (SERVER_HOME_EXPORTED) {
        configDir = 'configuration';
    }
    else {
        if (process.platform === 'darwin') {
            configDir = 'config_mac';
        }
        else if (process.platform === 'linux') {
            configDir = 'config_linux';
        }
        else {
            configDir = 'config_win';
        }
    }
    params.push('-configuration');
    params.push(path.resolve(server_home, configDir));
    params.push('-data');
    params.push(workspacePath);
    return params;
}
function startedInDebugMode() {
    let args = process.execArgv;
    if (args) {
        return args.some((arg) => /^--debug=?/.test(arg) || /^--debug-brk=?/.test(arg) || /^--inspect-brk=?/.test(arg));
    }
    ;
    return false;
}
//exported for tests
function parseVMargs(params, vmargsLine) {
    if (!vmargsLine) {
        return;
    }
    let vmargs = vmargsLine.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (vmargs === null) {
        return;
    }
    vmargs.forEach(arg => {
        //remove all standalone double quotes
        arg = arg.replace(/(\\)?"/g, function ($0, $1) { return ($1 ? $0 : ''); });
        //unescape all escaped double quotes
        arg = arg.replace(/(\\)"/g, '"');
        if (params.indexOf(arg) < 0) {
            params.push(arg);
        }
    });
}
exports.parseVMargs = parseVMargs;
//# sourceMappingURL=javaServerStarter.js.map