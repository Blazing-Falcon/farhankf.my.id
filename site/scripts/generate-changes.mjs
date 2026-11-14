// Writes the commit list the Revision history page shows. Runs before every
// build. A local checkout reads its own git log; the Docker build has no .git
// directory, so it reads the public repository instead. This script never
// fails the build: without a source the page says the list is unavailable.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'Blazing-Falcon/farhankf.my.id';
const LIMIT = 50;
const out = fileURLToPath(new URL('../src/data/changes.json', import.meta.url));

function fromGit() {
  const log = execFileSync('git', ['log', `-${LIMIT}`, '--format=%H%x09%cI%x09%s'], {
    cwd: dirname(out),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return log
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, date, ...subject] = line.split('\t');
      return { hash, date, subject: subject.join('\t') };
    });
}

async function fromGitHub() {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits?per_page=${LIMIT}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'farhankf-site-build' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  return (await response.json()).map((entry) => ({
    hash: entry.sha,
    date: entry.commit.committer.date,
    subject: entry.commit.message.split('\n')[0],
  }));
}

let commits = null;
try {
  commits = fromGit();
} catch {
  try {
    commits = await fromGitHub();
  } catch (error) {
    console.warn(`[changes] No commit list available: ${error.message}`);
  }
}

mkdirSync(dirname(out), { recursive: true });
if (commits) {
  writeFileSync(out, JSON.stringify({ repository: REPOSITORY, commits }, null, 2) + '\n');
  console.log(`[changes] Wrote ${commits.length} commits.`);
} else if (!existsSync(out)) {
  writeFileSync(out, JSON.stringify({ repository: REPOSITORY, commits: [] }, null, 2) + '\n');
}
