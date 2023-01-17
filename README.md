# very-secure-shell
In beta, tested on Linux with bash and on Windows with powershell.

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
  --password=<string> - Set up a password for a second layer of authentication. The password will also be sent in encryption.
  --quiet - Remove all info messages.
  --motd=<string> - Message of The Day when logging in.
  --pwdgen=<string> - The full command line (both program name and arguments) that generates a password on the stdout. NO INTERACTIVE TOOLS.

  No positionals
```

### totpgen.js
This requires you to install TOTP-PC: `npm init -y`, `npm install totp-pc`.

TOTPgen allows you to generate the TOTP password and passes the TOTP password and your password to stdout.
```
  --password=<string> - Your actual password.
  --concatchar=<string> - A separator between your password and the TOTP generation. Default: _
  --starttime=<number> - A start time in Unix Timestamp. Default: 0
  --timeframe=<number> - How many time (seconds) do you have before your TOTP expires. Default: 30
  --secret=<string> - Your TOTP-PC secret. You need to change this. Default: secret
  --length=<number> - TOTP-PC password length. Default: 6
```
You'll need to enter your password as [--PASSWORD][--CONCATCHAR][TOTP]

For example: `password_325775`

## Known args for client.js
```
  --port=<number> - Set up a port number that was used on the server. Default: 26
  --pubkey=<string-path> - Set up path to public key. Default: "./storeonserver_receive.pem"
  --privkey=<string-path> - Set up path to private key. Default: "./storeonserver_send.pem"
  --automatepassword=<string> - Set up automated password entry.
  --quiet - Remove all info messages, just print the output.

  Positional: server <string-ip> - Set up the server to connect to. This is required to fill in.
```