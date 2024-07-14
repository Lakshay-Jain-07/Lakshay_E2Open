'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const cp = require("child_process");
const path = require("path");
const settings_1 = require("./settings");
const pathExists = require('path-exists');
const expandHomeDir = require('expand-home-dir');
const findJavaHome = require('find-java-home');
/**
 * Resolves the requirements needed to run the extension.
 * Returns a promise that will resolve to a RequirementsData if
 * all requirements are resolved, it will reject with ErrorData if
 * if any of the requirements fails to resolve.
 */
function resolveRequirements() {
    return __awaiter(this, void 0, void 0, function* () {
        let javaExecutable = yield checkJavaRuntime();
        let javaVersion = yield checkJavaVersion(javaExecutable);
        return Promise.resolve({ 'java_executable': javaExecutable, 'java_version': javaVersion });
    });
}
exports.resolveRequirements = resolveRequirements;
function checkJavaRuntime() {
    return new Promise((resolve, reject) => {
        let source;
        let javaHome = readJavaConfig();
        if (javaHome) {
            source = 'The pydev.java.home variable defined in VS Code settings';
        }
        else {
            javaHome = process.env['JDK_HOME'];
            if (javaHome) {
                source = 'The JDK_HOME environment variable';
            }
            else {
                javaHome = process.env['JAVA_HOME'];
                source = 'The JAVA_HOME environment variable';
            }
        }
        if (javaHome) {
            javaHome = expandHomeDir(javaHome);
            if (!pathExists.sync(javaHome)) {
                openJavaDownload(reject, source + ' points to a missing folder');
            }
            let javaExecutable;
            if (process.platform == 'win32') {
                javaExecutable = path.join(javaHome, 'bin', 'java.exe');
            }
            else {
                javaExecutable = path.join(javaHome, 'bin', 'java');
            }
            if (pathExists.sync(javaExecutable)) {
                return resolve(javaExecutable);
            }
        }
        if (process.platform == 'win32') {
            let javaInProgramData = path.join(path.join('C:', 'ProgramData', 'Oracle', 'Java', 'javapath', 'java.exe'));
            if (pathExists.sync(javaInProgramData)) {
                return resolve(javaInProgramData);
            }
        }
        //No settings, let's try to detect as last resort.
        findJavaHome({ allowJre: true }, function (err, home) {
            if (err) {
                openJavaDownload(reject, 'Java runtime could not be located');
            }
            else {
                let javaExecutable;
                if (process.platform == 'win32') {
                    javaExecutable = path.join(home, 'bin', 'java.exe');
                }
                else {
                    javaExecutable = path.join(home, 'bin', 'java');
                }
                if (pathExists.sync(javaExecutable)) {
                    return resolve(javaExecutable);
                }
                else {
                    openJavaDownload(reject, 'Unable to find java executable');
                }
            }
        });
    });
}
function readJavaConfig() {
    return settings_1.getPyDevConfiguration().get(settings_1.JAVA_HOME, null);
}
function checkJavaVersion(javaExecutable) {
    return new Promise((resolve, reject) => {
        cp.execFile(javaExecutable, ['-version'], {}, (error, stdout, stderr) => {
            let javaVersion = parseMajorVersion(stderr);
            if (javaVersion < 11) {
                openJavaDownload(reject, 'Java 11 or more recent is required to run. Please download and install a recent JDK');
            }
            else {
                resolve(javaVersion);
            }
        });
    });
}
function parseMajorVersion(content) {
    let regexp = /version "(.*)"/g;
    let match = regexp.exec(content);
    if (!match) {
        return 0;
    }
    let version = match[1];
    //Ignore '1.' prefix for legacy Java versions
    if (version.startsWith('1.')) {
        version = version.substring(2);
    }
    //look into the interesting bits now
    regexp = /\d+/g;
    match = regexp.exec(version);
    let javaVersion = 0;
    if (match) {
        javaVersion = parseInt(match[0]);
    }
    return javaVersion;
}
exports.parseMajorVersion = parseMajorVersion;
function openJavaDownload(reject, cause) {
    let javaDownloadUrl = 'https://java.com/en/download/';
    reject({
        message: cause,
        label: 'Get Java Runtime',
        openUrl: vscode_1.Uri.parse(javaDownloadUrl),
        replaceClose: false
    });
}
//# sourceMappingURL=requirements.js.map