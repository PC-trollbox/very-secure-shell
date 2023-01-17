const net = require("net");
const args = require("util").parseArgs({
    allowPositionals: true,
    strict: false
});
const crypto = require("crypto");
const fs = require("fs");
const child_process = require("child_process");
if (args.values.quiet) {
    for (let thing in console) {
        if (typeof console[thing] == "function") {
            console[thing] = new Function();
        }
    }
}
console.log("[log] Getting RSA keys. If you receive an error, do node generate_keypairs to generate new keypairs or specify correct paths with --pubkey and --privkey.");
let pub = fs.readFileSync(args.values.pubkey || "./storeonserver_receive.pem");
let priv = fs.readFileSync(args.values.privkey || "./storeonserver_send.pem");
console.log("[log] RSA keys loaded!");

function myListener(socket) {
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
        socket.end();
        socket.destroy();
        console.log("[log] Connection from", socket.remoteAddress, "closed");
    });
    if (args.values.motd) {
        for (let a of args.values.motd) {
            socket.write(crypto.privateEncrypt(priv, (a||"")).toString("hex") + "\0");
        }
        socket.write(crypto.privateEncrypt(priv, "\r\n").toString("hex") + "\0");
    }
    if (!args.values.password && !args.values.pwdgen) {
        do_stuff(socket);
    } else {
        socket.write("33574550\0");
        socket.once("data", function(code) {
            try {
                if (args.values.pwdgen) {
                    child_process.exec(args.values.pwdgen, function(err, stdout, stderr) {
                        stdout = stdout.replaceAll("\r", "").replaceAll("\n", "");
                        if (crypto.publicDecrypt(pub, Buffer.from(code.toString().split("", code.length - 1).join(""), "hex")) == stdout) {
                            do_stuff(socket);
                        } else {
                            socket.write(crypto.privateEncrypt(priv, "Invalid password specified\r\n").toString("hex") + "\0");
                            socket.end();
                            return socket.destroy();
                        }
                    });
                } else if (crypto.publicDecrypt(pub, Buffer.from(code.toString().split("", code.length - 1).join(""), "hex")) == args.values.password) {
                    do_stuff(socket);
                } else {
                    socket.write(crypto.privateEncrypt(priv, "Invalid password specified\r\n").toString("hex") + "\0");
                    socket.end();
                    return socket.destroy();
                }
            } catch (e) {
                console.error(e)
                console.log("[err] Failed data from", socket.remoteAddress);
                socket.end();
                return socket.destroy();
            }
        });
    }
}
function do_stuff(socket) {
    let spawned = child_process.spawn(args.values.shell || "bash", (args.values.args ? args.values.args.split(",") : null) || ["-i"], {
        shell: true
    });
    let pile = "";
    socket.on("close", function() {
        spawned.kill();
    });
    socket.on("data", function(mydata) {
        pile = pile + mydata;
        while (pile.split("\0").length > 1 || pile.endsWith("\0")) {
            if (pile.endsWith("\0") && pile.split("\0").length == 1) pile = pile.split("", pile.length - 1).join("");
            let myDecryption;
            try {
                myDecryption = crypto.publicDecrypt(pub, Buffer.from(pile.split("\0")[0], "hex"));
            } catch {
                console.log("[err] Failed data from", socket.remoteAddress);
                socket.end();
                return socket.destroy();
            }
            spawned.stdin.write(myDecryption);
            pile = pile.split("\0").slice(1).join("\0");
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
    spawned.stdout.on("error", function() {
        socket.end();
        socket.destroy();
        console.error("[err] Failed data from shell, please specify your shell with --shell");
    });
    spawned.stderr.on("error", function() {
        socket.end();
        socket.destroy();
        console.error("[err] Failed data from shell, please specify your shell with --shell");
    });
    spawned.stdin.on("error", function() {
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