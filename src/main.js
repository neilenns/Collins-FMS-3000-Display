import { app, BrowserWindow, Menu } from 'electron';
import { get_private_ip } from 'network';
import { Server, OPEN } from 'ws';
import WinState from 'electron-win-state'
import * as Store from 'electron-store';
import { screen } from 'electron';

var windows = new Set();

// Moves all the app windows to the main display, turns off full screen mode,
// resets their size to 800x600, and centers them on the screen offset by
// 20 pixels each.
const resetWindows = () => {
  console.log("Resetting window positions");

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  let xOffset = 0;
  let yOffset = 0;

  windows.forEach((win) => {
    // For some reason just using the win object had cases where the window size wouldn't change for
    // the non-active window. ChatGPT suggested this fix and it seems to work, although I have no idea
    // why it would be any different than just using the win object.
    const targetWindow = BrowserWindow.fromId(win.id);

    targetWindow.setFullScreen(false);
    targetWindow.setSize(800, 600);

    const x = Math.floor((width - win.getSize()[0]) / 2) + xOffset;
    const y = Math.floor((height - win.getSize()[1]) / 2) + yOffset;

    targetWindow.setPosition(x, y);

    xOffset += 20;
    yOffset += 20;
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

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
        label: 'Reset windows',
        click: resetWindows,
        accelerator: 'F10'
      },
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

// Information on creating mulitple windows comes from https://spin.atomicobject.com/2021/07/08/multiple-windows-electron-app/.
const createWindows = () => {
  createWindow(1, "Collins FMS 3000: Pilot");
  createWindow(2, "Collins FMS 3000: Co-pilot");
}

const createWindow = (index, title) => {
  // Each window saves its settings in a separate store so window position is
  // maintained independently.
  const store = new Store({
    name: `window${index}-config`
  });

  // Create the browser window.
  var window = WinState.createBrowserWindow({
    width: 800,
    height: 600,
    title: title,
    winState: {
      store: store
    },
    webPreferences: {
      nodeIntegration: true,
      // This method of passing a parameter to the render process comes from
      // https://stackoverflow.com/questions/38335004/how-to-pass-parameters-from-main-process-to-render-processes-in-electron.
      // The queryparam method didn't work in the release version of the application due to
      // security policy preventing the url from opening.
      // additionalArguments expects an array of strings hence the funky wrapping of index.
      additionalArguments: [`${index}`],
      contextIsolation: false,
    },
    // The window is hidden by default so it can be set full screen if necessary before displaying.
    show: false
  });

  windows.add(window);

  // The electron-win-state package doesn't remember full screen state by default
  // so take care of that by reading a saved value from the store.
  var lastFullScreen = store.get('fullScreen');
  window.setFullScreen(store.get('fullScreen'));
  window.setMenuBarVisibility(!store.get('fullScreen'));
  
  window.show();

  // and load the index.html of the app.
  window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Assume the unpackaged app is being used for dev work and show the dev tools.
  if (!app.isPackaged) {
    window.webContents.openDevTools();
  }

  // When the app goes into and out of full screen the menu bar visibility gets set and full screen state is
  // is saved so it can be restored on future runs. 
  window.on('enter-full-screen', () => { window.setMenuBarVisibility(false); store.set('fullScreen', true); });
  window.on('leave-full-screen', () => { 
    window.setMenuBarVisibility(true); store.set('fullScreen', false); });
  
  // Handle closing windows.
  window.on('closed', () => { windows.delete(window); window = null; });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => { createWindows(); startSockets(); } );

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
    createWindow(1);
    createWindow(2);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
