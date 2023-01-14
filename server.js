const net = require("net");
const args = require("util").parseArgs({
    allowPositionals: true,
    strict: false
});
const crypto = require("crypto");
const fs = require("fs");
const child_process = require("child_process");
console.log("[log] Getting RSA keys. If you receive an error, do node generate_keypairs to generate new keypairs or specify correct paths with --pubkey and --privkey.");
let pub = fs.readFileSync(args.values.pubkey || "./storeonserver_receive.pem");
let priv = fs.readFileSync(args.values.privkey || "./storeonserver_send.pem");
console.log("[log] RSA keys loaded!");

function myListener(socket) {
    let spawned = child_process.spawn(args.values.shell || "bash", (args.values.args ? args.values.args.split(",") : null) || ["-i"], {
        shell: true
    });
    let pile = "";
    console.log("[log] Got connection from", socket.remoteAddress);
    socket.on("error", function() {
        socket.end();
        socket.destroy();
        console.error("[err] Failed data from", socket.remoteAddress);
    });
    socket.on("end", function() {
        socket.end();
        socket.destroy();
        console.log("[log] Connection from", socket.remoteAddress, "about to end");
    });
    socket.on("close", function() {
        spawned.kill();
        socket.end();
        socket.destroy();
        console.log("[log] Connection from", socket.remoteAddress, "closed");
    });
    socket.on("data", function(mydata) {
        pile = pile + mydata;
        if (pile.endsWith("\0")) {
            pile = pile.split("", pile.length - 1).join("");
            let myDecryption;
            try {
                myDecryption = crypto.publicDecrypt(pub, Buffer.from(pile.toString(), "hex"));
            } catch {
                console.log("[err] Failed data from", socket.remoteAddress);
                socket.end();
                return socket.destroy();
            }
            spawned.stdin.write(myDecryption);
            pile = "";
        }
    });
    spawned.stdout.on("data", function(decrypted) {
        decrypted = decrypted.toString();
        decrypted = decrypted.split("");
        for (let chunk in decrypted) {
            try {
                socket.write(crypto.privateEncrypt(priv, decrypted[chunk]||"").toString("hex") + "\0");
            } catch {
                console.error("[err] Failed data from shell, please specify your shell with --shell");
                socket.end();
                return socket.destroy();
            }
        }
    });
    spawned.stderr.on("data", function(decrypted) {
        decrypted = decrypted.toString();
        decrypted = decrypted.split("");
        for (let chunk in decrypted) {
            try {
                socket.write(crypto.privateEncrypt(priv, decrypted[chunk]||"").toString("hex") + "\0");
            } catch {
                console.error("[err] Failed data from shell, please specify your shell with --shell");
                socket.end();
                return socket.destroy();
            }
        }
    });
    spawned.on("error", function() {
        socket.end();
        socket.destroy();
        console.error("[err] Failed data from shell, please specify your shell with --shell");
    });
    spawned.on("close", function() {
        socket.end();
        socket.destroy();
    });
    spawned.on("end", function() {
        socket.end();
        socket.destroy();
    });
}

net.createServer(myListener).listen(args.values.port || 26, function() {
    console.log("[log] Server set up at :", args.values.port || 26);
});