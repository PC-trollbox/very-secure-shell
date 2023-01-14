# very-secure-shell
In beta, tested only on Linux.

Node.JS. Tested on v19.1.0

Very beta, recommended not to use as an alternative to SSH.

You can only use the keys cryptography as it's required to encrypt everything.

But if you want to you can set a program that requests a password for two-step logon.

## Known args for server.js
```
  --shell=<string> - Set up a shell location. This can be any program. Default: "bash"
  --args=<comma-separated-array> - Set up arguments for the shell. Default: [ "-i" ]
  --port=<number> - Set up a port number for usage on server. You can use this if you're launching from non-root. Default: 26
  --pubkey=<string-path> - Set up path to public key. Default: "./storeonserver_receive.pem"
  --privkey=<string-path> - Set up path to private key. Default: "./storeonserver_send.pem"

  No positionals
```

## Known args for client.js
```
  --port=<number> - Set up a port number that was used on the server. Default: 26
  --pubkey=<string-path> - Set up path to public key. Default: "./storeonserver_receive.pem"
  --privkey=<string-path> - Set up path to private key. Default: "./storeonserver_send.pem"

  Positional: server <string-ip> - Set up the server to connect to. This is required to fill in.
```
