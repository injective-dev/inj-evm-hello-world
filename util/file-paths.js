
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const { fileURLToPath } = url;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATHS = {
    dotEnv: path.resolve(__dirname, '../.env'),
    configJson: path.resolve(__dirname, '../config.json'),
    packageJson: path.resolve(__dirname, '../package.json'),
    logs: path.resolve(__dirname, '../logs.json.txt'),
    gitRefsHeadMain: path.resolve(__dirname, '../.git/refs/heads/main'),
};

export default FILE_PATHS;
