const { app, BrowserWindow } = require('electron');
const network = require('network');
const WebSocket = require('ws');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

let websocketPort = 8081;

const startSockets = () => {
  network.get_private_ip((err, ip) => {
    // Create websocket server
    let wss = null;

    wss = new WebSocket.Server({ port: websocketPort }, () => {
        console.clear();
        console.log('External MCDU server started.\n');
        console.log('Waiting for simulator...');
    });

    wss.on('error', (err) => {
        console.error(`${err}`);
        setTimeout(() => {
        }, 5000);
    });

    wss.on('connection', (ws) => {
        let isMcdu = false;
        ws.on('message', (message) => {
            message = message.toString();
            if (message === 'mcduConnected') {
                console.clear();
                console.log('\x1b[32mSimulator connected!\x1b[0m\n');
                if (err) {
                    console.log(`To control the MCDU from this device, open \x1b[47m\x1b[30mhttp://localhost:${httpPort}\x1b[0m in your browser.`);
                    console.log('\nTo control the MCDU from another device on your network, replace localhost with your local IP address.');
                    // eslint-disable-next-line max-len
                    console.log('To find your local IP address, see here: \x1b[47m\x1b[30mhttps://support.microsoft.com/en-us/windows/find-your-ip-address-in-windows-f21a9bbc-c582-55cd-35e0-73431160a1b9\x1b[0m');
                } else {
                    console.log(`To control the MCDU from another device on your network, open \x1b[47m\x1b[30mhttp://${ip}:${httpPort}\x1b[0m in your browser.`);
                    console.log(`To control the MCDU from this device, open \x1b[47m\x1b[30mhttp://localhost:${httpPort}\x1b[0m in your browser.`);
                }
                isMcdu = true;
                return;
            }
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
            if (debug) {
                console.log(message);
            }
        });
        ws.on('close', () => {
            if (isMcdu) {
                console.clear();
                console.log('\x1b[31mLost connection to simulator.\x1b[0m\n\nWaiting for simulator...');
            }
        });
    });
});
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  startSockets();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
