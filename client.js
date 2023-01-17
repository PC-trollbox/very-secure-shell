const net = require("net");
const args = require("util").parseArgs({
    allowPositionals: true,
    strict: false
});
const crypto = require("crypto");
const fs = require("fs");
let password_answered = false;
let stdin_stop = false;
if (args.values.quiet) {
    for (let thing in console) {
        if (typeof console[thing] == "function") {
            console[thing] = new Function();
        }
    }
}
console.log("[log] Getting RSA keys. If you receive an error, do node generate_keypairs to generate new keypairs or specify correct paths with --pubkey and --privkey.");
let pub = fs.readFileSync(args.values.pubkey || "./storeonclient_receive.pem");
let priv = fs.readFileSync(args.values.privkey || "./storeonclient_send.pem");
console.log("[log] RSA keys loaded!");

let connected = net.createConnection(args.values.port || 26, args.positionals[0], function() {
    let pile = "";
    connected.on("close", function() {
        console.error("[err] Server closed connection");
        process.exit(1);
    });
    connected.on("end", function() {
        console.error("[err] Server ended connection");
        process.exit(1);
    });
    connected.on("error", function() {
        console.error("[err] Connection error");
        process.exit(1);
    });
    connected.on("data", function(mydata) {
        pile = pile + mydata;
        while (pile.split("\0").length > 1 || pile.endsWith("\0")) {
            if (pile.endsWith("\0") && pile.split("\0").length == 1) pile = pile.split("", pile.length - 1).join("");
            if (pile.split("\0")[0] == "33574550" && !password_answered && args.values.automatepassword) {
                if (args.values.automatepassword.length >= 2048) {
                    console.log("There's more data than allowed.");
                    process.exit(1);
                }
                password_answered = true;
                pile = pile.split("\0").slice(1).join("\0");
                return connected.write(crypto.privateEncrypt(priv, args.values.automatepassword).toString("hex") + "\0");
            } else if (pile.split("\0")[0] == "33574550" && !password_answered) {
                console.log("[log] Protected by Password");
                const readline = require('readline');
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                stdin_stop = true;
                return rl.question("\x1b[0mEnter password: \x1b[8m", function(pass) {
                    rl.close();
                    process.stdin.resume();
                    if (process.stdin.setRawMode) process.stdin.setRawMode(true);
                    process.stdout.write("\x1b[0m");
                    stdin_stop = false;
                    if (pass.length >= 2048) {
                        console.log("There's more data than allowed.");
                        process.exit(1);
                    }
                    password_answered = true;
                    pile = pile.split("\0").slice(1).join("\0");
                    connected.write(crypto.privateEncrypt(priv, pass).toString("hex") + "\0");
                });
            }
            let myDecryption;
            try {
                myDecryption = crypto.publicDecrypt(pub, Buffer.from(pile.split("\0")[0], "hex"));
            } catch {
                console.error("[err] Failed data from server");
                connected.end();
                return connected.destroy();
            }
            process.stdout.write(myDecryption);
            pile = pile.split("\0").slice(1).join("\0");
        }
    });
    process.stdin.resume();
    if (process.stdin.setRawMode) process.stdin.setRawMode(true);
    let stdin = process.openStdin();
    stdin.on("data", function(e) {
        if (!stdin_stop) connected.write(crypto.privateEncrypt(priv, e).toString("hex") + "\0");
    });
});