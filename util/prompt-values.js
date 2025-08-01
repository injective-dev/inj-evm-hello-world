#!/usr/bin/env node
import readline from 'node:readline/promises';
import node_process from 'node:process';
import fs from 'node:fs/promises';

import dotenv from 'dotenv';
import bip39 from 'bip39';

const { stdin, stdout } = node_process;
import { Logger } from './logger.js';
import formatter from './formatter.js';
import FILE_PATHS from './file-paths.js';

const logger = new Logger();
await logger.init();

async function promptUser() {
    const env = {};
    dotenv.config({
        path: FILE_PATHS.dotEnv,
        processEnv: env,
    });

    let {
        SEED_PHRASE,
    } = env;
    let {
        rpcUrl,
    } = logger.configJson;

    while (true) {
        logger.logSection('Please enter the requested values to populate your .env and other config files.');

        env.SEED_PHRASE = await promptInput(SEED_PHRASE, {
            inputName: 'BIP39 seed phrase',
            defaultValueFn: () => (bip39.generateMnemonic(128)),
            validateValueFn: (value) => (bip39.validateMnemonic(value)),
        });
        logger.configJson.rpcUrl = await promptInput(rpcUrl, {
            inputName: 'JSON-RPC endpoint URL',
            defaultValueFn: () => ('https://k8s.testnet.json-rpc.injective.network/'),
            validateValueFn: (value) => (typeof value === 'string' && value.match(/^https?\:\/\/.*$/)),
        });

        if (
            env.SEED_PHRASE &&
            logger.configJson.rpcUrl
        ) {
            break;
        }
    }

    console.log('env', env);
    console.log('configJson', logger.configJson);
    return {
        env,
        configJson: logger.configJson,
    };
}

async function updateFiles({ env, configJson }) {
    const dotEnvStr = `
SEED_PHRASE="${env.SEED_PHRASE}"
`;
    await fs.writeFile(
        FILE_PATHS.dotEnv,
        dotEnvStr,
    );
    console.log('Env vars written.', FILE_PATHS.dotEnv);

    const configJsonStr = JSON.stringify(configJson, undefined, 2);
    await fs.writeFile(
        FILE_PATHS.configJson,
        configJsonStr,
    );
    console.log('Env vars written.', FILE_PATHS.configJson);
}

async function promptInput(value, {
    inputName,
    defaultValueFn,
    validateValueFn,
}) {
    let valid = false;
    logger.log(`Enter value for ${inputName}`);
    while (!valid) {
        if (value) {
            logger.log(`Current: "${value}"`);
            logger.log('(enter blank to re-use the above value)');
            logger.log('(OR enter "new" to use a default value or generate a new value)');
        } else {
            logger.log('(enter "new" to use a default value or generate a new value)');
        }
        const rlPrompt = readline.createInterface({
            input: stdin,
            output: stdout,
        });
        const inputValue = await rlPrompt.question('> ');
        rlPrompt.close();
        if (inputValue === 'new') {
            // generate seed phrase if none is input
            value = defaultValueFn();
        } else if (inputValue) {
            // use the input seed phrase
            value = inputValue;
        }

        // validate seed phrase
        valid = validateValueFn(value);

        if (!valid) {
            logger.logError('Invalid BIP-39 seed phrase, please try again.', value);
        }
    }

    return value;
}

async function initDotEnv() {
    const results = await promptUser();
    await updateFiles(results);
    await logger.logSetupEnd('Set up complete!');
}

initDotEnv();
