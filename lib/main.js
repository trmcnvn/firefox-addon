"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core = __importStar(require("@actions/core"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const form_data_1 = __importDefault(require("form-data"));
const https_1 = __importDefault(require("https"));
function generateJWT(key, secret) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = {
        iss: key,
        jti: Math.random().toString(),
        iat: issuedAt,
        exp: issuedAt + 60
    };
    return jsonwebtoken_1.default.sign(payload, secret, {
        algorithm: 'HS256'
    });
}
function sendRequest(xpiPath, manifest, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // read version from manifest
        const manifestJson = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(manifest), 'utf8'));
        const version = manifestJson.version;
        core.debug(`found addon version: ${version}`);
        // addon and version
        const addonBuffer = fs_1.default.readFileSync(path_1.default.resolve(xpiPath));
        const body = new form_data_1.default();
        body.append('upload', addonBuffer);
        body.append('version', version);
        // Send request
        const request = https_1.default.request({
            method: 'put',
            hostname: 'addons.mozilla.org',
            path: '/api/v4/addons/',
            headers: Object.assign({}, body.getHeaders(), { Authorization: `JWT ${token}` })
        });
        body.pipe(request).on('response', res => {
            core.debug(res);
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const path = core.getInput('xpi', { required: true });
            const manifest = core.getInput('manifest', { required: true });
            const key = core.getInput('api-key', { required: true });
            const secret = core.getInput('api-secret', { required: true });
            const token = generateJWT(key, secret);
            const response = yield sendRequest(path, manifest, token);
            core.debug(`Published version ${response.version}`);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
