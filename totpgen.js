const args = require("util").parseArgs({
    allowPositionals: true,
    strict: false
});
const totp_pc = require("totp-pc");
process.stdout.write(args.values.password + (args.values.concat_char || "_") + totp_pc.getHash(args.values.secret || "secret", args.values.starttime || 0, "sha256", args.values.timeframe || 30, args.values.length || 6))