import fs from 'fs';
import path from 'path';
import * as core from '@actions/core';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import axios from 'axios';

function generateJWT(key: string, secret: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    iss: key,
    jti: Math.random().toString(),
    iat: issuedAt,
    exp: issuedAt + 60
  };
  return jwt.sign(payload, secret, {
    algorithm: 'HS256'
  });
}

async function sendRequest(xpiPath: string, manifest: string, token: string): Promise<any> {
  // read version from manifest
  const manifestJson = JSON.parse(fs.readFileSync(path.resolve(manifest), 'utf8'));
  const version = manifestJson.version;
  core.debug(`found addon version: ${version}`);

  // addon and version
  const body = new FormData();
  body.append('upload', fs.createReadStream(path.resolve(xpiPath)));
  body.append('version', version);

  // Send request
  const response = await axios.post('https://addons.mozilla.org/api/v4/addons/', body, {
    headers: {
      ...body.getHeaders(),
      Authorization: `JWT ${token}`
    }
  });
  core.debug(`Response: ${response.data}`);
}

async function run() {
  try {
    const path = core.getInput('xpi', { required: true });
    const manifest = core.getInput('manifest', { required: true });
    const key = core.getInput('api-key', { required: true });
    const secret = core.getInput('api-secret', { required: true });

    const token = generateJWT(key, secret);
    const response = await sendRequest(path, manifest, token);

    // core.debug(`Published version ${response.version}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
