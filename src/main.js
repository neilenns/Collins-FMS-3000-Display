import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { get_private_ip } from 'network';
import { Server, OPEN } from 'ws';
import WinState from 'electron-win-state'
import * as Store from 'electron-store';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const store = new Store();

const blankScreen = {
  lines: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
  ],
  scratchpad: '',
  message: '',
  title: '',
  titleLeft: '',
  page: '',
  exec: false,
  power: false,
};

const powerOffMessage = "update:" + JSON.stringify({ left: blankScreen, right: blankScreen });

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        role: 'quit'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        role: 'togglefullscreen'
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)

let websocketPort = 8088;

const startSockets = () => {
  get_private_ip((err, ip) => {
    // Create websocket server
    let wss = null;

    wss = new Server({ port: websocketPort }, () => {
      console.clear();
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
          isMcdu = true;
          return;
        }
        wss.clients.forEach((client) => {
          if (client.readyState === OPEN) {
            client.send(message);
          }
        });
      });
      ws.on('close', () => {
        if (isMcdu) {
          wss.clients.forEach((client) => {
            if (client.readyState === OPEN) {
                client.send(powerOffMessage);
            }
          });
          console.clear();
          console.log('\x1b[31mLost connection to simulator.\x1b[0m\n\nWaiting for simulator...');
        }
      });
    });
  });
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = WinState.createBrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    // The window is hidden by default so it can be set full screen if necessary before displaying.
    show: false
  });

  // The electron-win-state package doesn't remember full screen state by default
  // so take care of that by reading a saved value from the store.
  mainWindow.setFullScreen(store.get('fullScreen'));
  mainWindow.setMenuBarVisibility(!store.get('fullScreen'));
  mainWindow.show();

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Assume the unpackaged app is being used for dev work and show the dev tools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // When the app goes into and out of full screen the menu bar visibility gets set and full screen state is
  // is saved so it can be restored on future runs. 
  mainWindow.on('enter-full-screen', () => { mainWindow.setMenuBarVisibility(false); store.set('fullScreen', true); });
  mainWindow.on('leave-full-screen', () => { mainWindow.setMenuBarVisibility(true); store.set('fullScreen', false); });

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
