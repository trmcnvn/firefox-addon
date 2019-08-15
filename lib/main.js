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
const axios_1 = __importDefault(require("axios"));
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
function updateExistingAddon(uuid, xpiPath, version, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // addon
        const body = new form_data_1.default();
        body.append('upload', fs_1.default.createReadStream(path_1.default.resolve(xpiPath)));
        // Send request
        const uri = `https://addons.mozilla.org/api/v4/addons/${encodeURIComponent(uuid)}/versions/${encodeURIComponent(version)}/`;
        core.debug(`URL: ${uri}`);
        const response = yield axios_1.default.put(uri, body, {
            headers: Object.assign({}, body.getHeaders(), { Authorization: `JWT ${token}` })
        });
        core.debug(`Response: ${JSON.stringify(response.data)}`);
    });
}
function createNewAddon(xpiPath, version, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // addon and version
        const body = new form_data_1.default();
        body.append('upload', fs_1.default.createReadStream(path_1.default.resolve(xpiPath)));
        body.append('version', version);
        // Send request
        const uri = 'https://addons.mozilla.org/api/v4/addons/';
        core.debug(`URL: ${uri}`);
        const response = yield axios_1.default.post(uri, body, {
            headers: Object.assign({}, body.getHeaders(), { Authorization: `JWT ${token}` })
        });
        core.debug(`Response: ${JSON.stringify(response.data)}`);
    });
}
function sendRequest(uuid, xpiPath, manifest, token) {
    return __awaiter(this, void 0, void 0, function* () {
        // read version from manifest
        const manifestJson = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(manifest), 'utf8'));
        const version = manifestJson.version;
        core.debug(`found addon version: ${version}`);
        if (uuid && uuid.length > 0) {
            yield updateExistingAddon(uuid, xpiPath, version, token);
        }
        else {
            yield createNewAddon(xpiPath, version, token);
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const uuid = core.getInput('uuid');
            const path = core.getInput('xpi', { required: true });
            const manifest = core.getInput('manifest', { required: true });
            const key = core.getInput('api-key', { required: true });
            const secret = core.getInput('api-secret', { required: true });
            const token = generateJWT(key, secret);
            yield sendRequest(uuid, path, manifest, token);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
