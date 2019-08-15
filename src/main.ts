import fs from 'fs';
import path from 'path';
import * as core from '@actions/core';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import https from 'https';

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
  const addonBuffer = fs.readFileSync(path.resolve(xpiPath));
  const body = new FormData();
  body.append('upload', addonBuffer);
  body.append('version', version);

  // Send request
  const request = https.request({
    method: 'put',
    hostname: 'addons.mozilla.org',
    path: '/api/v4/addons/',
    headers: {
      ...body.getHeaders(),
      Authorization: `JWT ${token}`
    }
  });
  body.pipe(request).on('response', res => {
    core.debug(JSON.stringify(res));
  });
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
