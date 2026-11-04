// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("operator provisioning representations", () => {
  it("preserves scrypt dollars through actual Next dotenv loading without logging secrets", () => {
    const fixture = mkdtempSync(path.join(tmpdir(), "drona-auth-dotenv-fixture-"));
    try {
      writeFileSync(path.join(fixture, ".gitignore"), "/.local/\n", { mode: 0o600 });
      const provisioner = path.resolve("scripts/provision-demo.mjs");
      // A fresh process prevents @next/env's global loaded-env cache from hiding
      // the bug and keeps all randomly generated fixture credentials out of logs.
      const code = `
        const fs = require('node:fs');
        const path = require('node:path');
        const crypto = require('node:crypto');
        const {spawnSync} = require('node:child_process');
        const {loadEnvConfig} = require('@next/env');
        const root = process.argv[1];
        const provisioner = process.argv[2];
        const output = spawnSync(process.execPath, [provisioner,
          '--username','ephemeral.fixture','--origin','http://127.0.0.1:3499',
          '--expires','2099-01-01T00:00:00.000Z','--out','.local/fixture-access'],
          {cwd:root, encoding:'utf8'});
        if (output.status !== 0) { process.stdout.write(JSON.stringify({provisioned:false})); process.exit(0); }
        const directory = path.join(root,'.local/fixture-access');
        const raw = JSON.parse(fs.readFileSync(path.join(directory,'hosting-config.json'),'utf8'));
        const dotenv = fs.readFileSync(path.join(directory,'configuration.env'),'utf8');
        const credentials = fs.readFileSync(path.join(directory,'credentials.txt'),'utf8');
        const rawInvite = JSON.parse(raw.DRONA_DEMO_INVITES_JSON)[0];
        const password = credentials.match(/Password: ([^\\n]+)/)[1];
        fs.copyFileSync(path.join(directory,'configuration.env'),path.join(root,'.env.local'));
        for(const key of Object.keys(process.env)) if(key.startsWith('DRONA_') || key==='__NEXT_PROCESSED_ENV') delete process.env[key];
        process.env.NODE_ENV='development';
        const loaded = loadEnvConfig(root,true,{info(){},error(){}},true).combinedEnv;
        const invite = JSON.parse(loaded.DRONA_DEMO_INVITES_JSON)[0];
        const pieces = invite.passwordHash.split('$');
        const key = crypto.scryptSync(password,Buffer.from(pieces[4],'base64url'),64,{N:131072,r:8,p:1,maxmem:256*1024*1024});
        const logs = output.stdout + output.stderr;
        const same = Object.entries(raw).every(([name,value])=>loaded[name]===value);
        const noSecrets = [password, raw.DRONA_SESSION_SECRET, raw.DRONA_DEMO_INVITES_JSON, rawInvite.passwordHash].every(value=>!logs.includes(value));
        const modes = ['configuration.env','hosting-config.json','credentials.txt','OPERATIONS.txt'].every(name=>(fs.statSync(path.join(directory,name)).mode & 0o777)===0o600);
        const retry=spawnSync(process.execPath,[provisioner,'--username','ephemeral.fixture','--origin','http://127.0.0.1:3499','--expires','2099-01-01T00:00:00.000Z','--out','.local/fixture-access'],{cwd:root,encoding:'utf8'});
        process.stdout.write(JSON.stringify({provisioned:true,rawMatchesLoaded:same,scryptShape:/^scrypt\\$131072\\$8\\$1\\$/.test(invite.passwordHash),dotenvEscaped:dotenv.includes('scrypt\\\\$131072\\\\$8'),hostRawUnescaped:!raw.DRONA_DEMO_INVITES_JSON.includes('\\\\$'),passwordMatches:crypto.timingSafeEqual(key,Buffer.from(pieces[5],'base64url')),noSecretOutput:noSecrets,privateFiles:modes,overwriteRefused:retry.status!==0,stillSameRaw:fs.readFileSync(path.join(directory,'hosting-config.json'),'utf8').includes(raw.DRONA_SESSION_SECRET)}));
      `;
      const result = spawnSync(process.execPath, ["-e", code, fixture, provisioner], { cwd: process.cwd(), encoding: "utf8" });
      // Only safe booleans cross the process boundary; on error, don't echo stderr
      // or arbitrary generated files into a failed assertion report.
      expect(result.status === 0).toBe(true);
      let checks: Record<string, boolean> = {};
      try { checks = JSON.parse(result.stdout); } catch { /* safe assertion below */ }
      expect(checks).toEqual({ provisioned: true, rawMatchesLoaded: true, scryptShape: true, dotenvEscaped: true, hostRawUnescaped: true, passwordMatches: true, noSecretOutput: true, privateFiles: true, overwriteRefused: true, stillSameRaw: true });
    } finally { rmSync(fixture, { recursive: true, force: true }); }
  }, 15000);
});
