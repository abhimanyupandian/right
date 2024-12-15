// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge } from 'electron';

export type ExposeInRendererTypes = typeof exposeInRenderer;
const exposeInRenderer = {};

for (const [key, value] of Object.entries(exposeInRenderer)) contextBridge.exposeInMainWorld(key, value);