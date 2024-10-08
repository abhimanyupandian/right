// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

export type ExposeInRendererTypes = typeof exposeInRenderer;
const exposeInRenderer = {
	arthur: {
		start: () => ipcRenderer.send('wake-up-arthur'),
		says: (channel: string, callback: any) => {
			const newCallback = (_: any, data: any) => callback(data);
			ipcRenderer.on(channel, newCallback);
		}
	}
};

for (const [key, value] of Object.entries(exposeInRenderer)) contextBridge.exposeInMainWorld(key, value);