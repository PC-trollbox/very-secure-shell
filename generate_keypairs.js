const net = require("net");
const args = require("util").parseArgs({
    allowPositionals: true,
    strict: false
});
const crypto = require("crypto");
const fs = require("fs");

const recs = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    }
});

const sends = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    }
});
fs.writeFileSync(__dirname + "/storeonclient_send.pem", recs.privateKey);
fs.writeFileSync(__dirname + "/storeonserver_receive.pem", recs.publicKey);
fs.writeFileSync(__dirname + "/storeonserver_send.pem", sends.privateKey);
fs.writeFileSync(__dirname + "/storeonclient_receive.pem", sends.publicKey);

console.log("All required keys generated.")