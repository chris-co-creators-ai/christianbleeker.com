from pathlib import Path
from tempfile import TemporaryDirectory
import os
import socket
import subprocess
import time


def run(helper, action, env):
    return subprocess.run(
        ["zsh", str(helper), action], env=env, text=True,
        capture_output=True, timeout=55,
    )


with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]

test_repo = "voorbeeld-klant/website"
source = Path(__file__).with_name("website-local.sh").read_text()
source = source.replace("Seveke-Creative-NL/christianbleeker-bouw", test_repo)
with TemporaryDirectory(prefix="klant-site-test-") as temp:
    root = Path(temp)
    repo = root / "site"
    repo.mkdir()
    subprocess.run(["git", "init", "-q", str(repo)], check=True)
    subprocess.run(
        ["git", "-C", str(repo), "remote", "add", "origin", f"https://github.com/{test_repo}.git"],
        check=True,
    )
    next_bin = repo / "node_modules/next/dist/bin/next"
    next_bin.parent.mkdir(parents=True)
    next_bin.write_text(
        "const http=require('http');"
        "http.createServer((req,res)=>res.end('site test')).listen(Number(process.argv.at(-1)),'127.0.0.1');\n"
    )
    helper = root / "website-local.sh"
    helper.write_text(source.replace("3000", str(port)))
    env = dict(os.environ, SITE_DIR=str(repo), XDG_STATE_HOME=str(root / "state"))
    pid_file = root / "state/klant-website/website.pid"
    try:
        for action in ("start", "status", "stop"):
            result = run(helper, action, env)
            assert result.returncode == 0, (action, result.stdout, result.stderr)
        for _ in range(40):
            with socket.socket() as probe:
                if probe.connect_ex(("127.0.0.1", port)) != 0:
                    break
            time.sleep(0.25)
        else:
            raise AssertionError("test server still listens after stop")
        assert not pid_file.exists()
        subprocess.run(
            ["git", "-C", str(repo), "remote", "set-url", "origin", "https://github.com/ander-account/anders.git"],
            check=True,
        )
        assert run(helper, "start", env).returncode == 2
        print("start/status/stop and wrong-repository refusal passed")
    finally:
        if pid_file.exists():
            pid = int(pid_file.read_text().split("\t")[-1])
            try:
                os.kill(pid, 15)
            except ProcessLookupError:
                pass
