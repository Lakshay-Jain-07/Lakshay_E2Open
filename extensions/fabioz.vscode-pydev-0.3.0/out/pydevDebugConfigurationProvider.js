// import * as vscode from "vscode";
// 
// export class PyDevDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
// 
//     public provideDebugConfigurations(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken):
//         vscode.ProviderResult<vscode.DebugConfiguration[]> {
//         return <Thenable<vscode.DebugConfiguration[]>>this.provideDebugConfigurationsAsync(folder);
//     }
// 
//     public resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken):
//         vscode.ProviderResult<vscode.DebugConfiguration> {
//         return this.resolveDebugConfigurationAsync(folder, debugConfiguration);
//     }
// 
//     private provideDebugConfigurationsAsync(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken) {
//         return vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, (p) => {
//             return new Promise((resolve, reject) => {
//                 p.report({ message: "PyDev: Auto generating configuration..." });
//                 resolve({
//                     "type": "PyDev",
//                     "name": "PyDev Debug (Launch)",
//                     "request": "launch",
//                     "cwd": "^\"\\${workspaceFolder}\"",
//                     "console": "internalConsole",
//                     "mainModule": "",
//                     "args": ""
//                 });
//             });
//         });
//     }
// 
//     private async resolveDebugConfigurationAsync(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration) {
//         return config;
//     }
// } 
//# sourceMappingURL=pydevDebugConfigurationProvider.js.map