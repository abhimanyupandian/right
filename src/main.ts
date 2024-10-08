import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import path from 'path';
import url from 'url';
import { stat } from 'node:fs/promises';
import nodeChildProcess from 'child_process';

import log from 'electron-log/main';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import electronSquirrelStartup from 'electron-squirrel-startup';
if (electronSquirrelStartup) app.quit();

// Only one instance of the electron main process should be running due to how chromium works.
// If another instance of the main process is already running `app.requestSingleInstanceLock()`
// will return false, `app.quit()` will be called, and the other instances will receive a
// `'second-instance'` event.
// https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelockadditionaldata
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

// This event will be called when a second instance of the app tries to run.
// https://www.electronjs.org/docs/latest/api/app#event-second-instance
app.on('second-instance', (event, args, workingDirectory, additionalData) => {
	createWindow();
});

const dev = !app.isPackaged;
const scheme = 'app';
const srcFolder = path.join(app.getAppPath(), `.vite/renderer/main_window/`);
const staticAssetsFolder = import.meta.env.DEV ? path.join(import.meta.dirname, '..', '..', 'static') : srcFolder;
const ollamaPath = app.isPackaged ? path.join(process.resourcesPath) :
	import.meta.env.DEV ? path.join(import.meta.dirname, '..', '..', '..', 'bin') : path.join('bin');

protocol.registerSchemesAsPrivileged([{
	scheme: scheme,
	privileges: {
		standard: true,
		secure: true,
		allowServiceWorkers: true,
		supportFetchAPI: true,
		corsEnabled: false,
	},
},
]);

app.on('ready', () => {
	protocol.handle(scheme, async (request) => {
		const requestPath = path.normalize(decodeURIComponent(new URL(request.url).pathname));

		async function isFile(filePath: string) {
			try {
				if ((await stat(filePath)).isFile()) return filePath;
			}
			catch (e) { }
		}

		const responseFilePath = await isFile(path.join(srcFolder, requestPath))
			?? await isFile(path.join(srcFolder, path.dirname(requestPath), `${path.basename(requestPath) || 'index'}.html`))
			?? path.join(srcFolder, '200.html');
		return await net.fetch(url.pathToFileURL(responseFilePath).toString());
	});
});

var mainWindow: BrowserWindow;
var authurId: number | undefined;
var ollama: nodeChildProcess.ChildProcessWithoutNullStreams | null;

function shutdown() {
	if (ollama) {
		ollama.kill('SIGINT');
		ollama = null;
	}
	// process.exit(0);
}

function wakeUpArthur() {
	if (!authurId) {
		ollama = nodeChildProcess.spawn(
			path.join(ollamaPath, 'ollama'),
			['serve'],
			{ env: { ...process.env, OLLAMA_HOST: '127.0.0.1:11444' }, detached: false },
		);
		authurId = ollama.pid;
		ollama.stdout.on('data', (data) => {
			console.log('stdout: ' + data);
			if (mainWindow.isDestroyed()) return;
			mainWindow.webContents.send('arthur-says', { event: 'stdout', message: data })
		});

		ollama.stderr.on('data', (err) => {
			console.log('stderr: ' + err);
			if (mainWindow.isDestroyed()) return;
			mainWindow.webContents.send('arthur-says', { event: 'stderr', message: err })
		});

		ollama.on('exit', (code) => {
			if (mainWindow.isDestroyed()) return;
			mainWindow.webContents.send('arthur-says', { event: 'exit', message: code })
		});
	}
	console.log('Arthur ID: ' + authurId);
	mainWindow.webContents.send('arthur-says', { event: 'id', message: authurId })

}


function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		icon: path.join(staticAssetsFolder, '/icon.png'),
		width: 900,
		height: 700,
		minWidth: 400,
		minHeight: 200,
		// Window Controls Overlay API - https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
		// Allows for a custom window header while overlaying native window controls in the corner.
		// https://www.electronjs.org/docs/latest/tutorial/window-customization#window-controls-overlay
		titleBarStyle: 'hidden',
		autoHideMenuBar: true,
		backgroundColor: 'transparent',
		webPreferences: {
			preload: path.join(import.meta.dirname, '../preload/preload.js'),
		}
	});

	if (import.meta.env.DEV) {
		mainWindow.loadURL(VITE_DEV_SERVER_URLS['main_window']);
		// Open the DevTools.
		mainWindow.webContents.openDevTools();
	}
	else {
		mainWindow.loadURL('app://-/');
	}

	mainWindow.maximize();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
app.on('before-quit', shutdown);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	createWindow()
})

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
ipcMain.on('toggleDevTools', (event) => {
	event.sender.toggleDevTools();
});
ipcMain.on('wake-up-arthur', (event) => {
	wakeUpArthur();
});