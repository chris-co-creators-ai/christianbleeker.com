#!/bin/zsh
set -euo pipefail

action="${1:-}"
if [[ "$action" != start && "$action" != stop && "$action" != status ]]; then
  print -u2 'Gebruik: website-local.sh start|stop|status (met SITE_DIR naar de klant-clone)'
  exit 2
fi

# Vul in per klant: eigenaar/naam van de GitHub-repo, bijv. seveke-creative-nl/klantnaam-website
expected_repo="Seveke-Creative-NL/christianbleeker-bouw"

site_dir="${SITE_DIR:-$PWD}"
site_dir="$(cd "$site_dir" && pwd -P)"
remote="$(git -C "$site_dir" remote get-url origin)"
if [[ "$remote" != "git@github.com:${expected_repo}.git" && "$remote" != "https://github.com/${expected_repo}.git" ]]; then
  print -u2 "Gestopt: dit is niet de repository ${expected_repo}."
  exit 2
fi

state_dir="${XDG_STATE_HOME:-$HOME/.local/state}/klant-website"
pid_file="$state_dir/website.pid"
log_file="$state_dir/website.log"
next_bin="$site_dir/node_modules/next/dist/bin/next"

owned_pid() {
  [[ -f "$pid_file" ]] || return 1
  local saved_dir saved_pid command
  IFS=$'\t' read -r saved_dir saved_pid < "$pid_file"
  [[ "$saved_dir" == "$site_dir" && "$saved_pid" == <-> ]] || return 1
  command="$(ps -ww -p "$saved_pid" -o command= 2>/dev/null || true)"
  [[ "$command" == *"$next_bin dev --hostname 127.0.0.1 --port 3000"* ]] || return 1
  REPLY="$saved_pid"
}

port_pid="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
case "$action" in
  status)
    if owned_pid; then
      print "Website gestart: http://127.0.0.1:3000 (PID $REPLY)."
    elif [[ -n "$port_pid" ]]; then
      print "Poort 3000 is bezet door een ander of onbeheerd proces (PID $port_pid)."
    else
      print 'Website staat uit.'
    fi
    ;;
  start)
    if owned_pid; then
      print 'Website draait al op http://127.0.0.1:3000.'
      exit 0
    fi
    if [[ -n "$port_pid" ]]; then
      print -u2 "Poort 3000 is bezet (PID $port_pid); niets overgenomen."
      exit 1
    fi
    [[ -f "$next_bin" ]] || { print -u2 'Next.js ontbreekt; installeer eerst de dependencies in deze clone.'; exit 1; }
    mkdir -p "$state_dir"
    nohup node "$next_bin" dev --hostname 127.0.0.1 --port 3000 > "$log_file" 2>&1 < /dev/null &
    child_pid=$!
    print -r -- "$site_dir"$'\t'"$child_pid" > "$pid_file"
    for attempt in {1..40}; do
      if curl -fsS -o /dev/null --max-time 2 http://127.0.0.1:3000/ 2>/dev/null; then
        print 'Website gestart: http://127.0.0.1:3000.'
        exit 0
      fi
      if ! kill -0 "$child_pid" 2>/dev/null; then break; fi
      sleep 1
    done
    if owned_pid; then kill "$REPLY" 2>/dev/null || true; fi
    rm -f "$pid_file"
    print -u2 "Website werd niet gezond op poort 3000. Bekijk $log_file."
    exit 1
    ;;
  stop)
    if ! owned_pid; then
      print -u2 'Geen door deze helper gestart proces gevonden; niets gestopt.'
      exit 1
    fi
    kill "$REPLY"
    for attempt in {1..40}; do
      if ! owned_pid; then
        rm -f "$pid_file"
        if [[ -z "$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null | head -n 1 || true)" ]]; then
          print 'Website gestopt; poort 3000 is vrij.'
        else
          print 'Website gestopt; poort 3000 wordt inmiddels door een ander proces gebruikt.'
        fi
        exit 0
      fi
      sleep 0.25
    done
    print -u2 'Stop-signaal verzonden, maar het proces draait nog. Controleer het proces handmatig.'
    exit 1
    ;;
esac
