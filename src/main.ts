import { startApp } from '@ui/app';

const root = document.getElementById('app');
if (root) startApp(root);
else console.error('Gatecast: #app element not found.');
