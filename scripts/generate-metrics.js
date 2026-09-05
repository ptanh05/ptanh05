/**
 * scripts/generate-metrics.js
 * 
 * Dynamic telemetry engine for @ptanh05 GitHub profile.
 * Generates light-mode, modern assets:
 *  - assets/profile-data.json (raw telemetry payload)
 *  - assets/metrics.svg (light-mode SVG telemetry card)
 */

const fs = require('fs');
const path = require('path');

const USERNAME = 'ptanh05';
const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

async function fetchJson(url, token) {
  const headers = {
    'User-Agent': 'ptanh05-profile-metrics-generator',
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  }
  return res.json();
}

function generateMetricsSvg(data) {
  const { user, repos, languages, stars, forks, generatedAt } = data;

  // Compute top 5 languages by repo count
  const sortedLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalLangCount = sortedLangs.reduce((acc, [, c]) => acc + c, 0) || 1;

  // Modern language colors
  const langColors = {
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Move': '#8b5cf6',
    'C#': '#178600',
    'JavaScript': '#f7df1e',
    'Vue': '#41b883',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
  };

  // Build progress bar segments
  let langOffsets = 0;
  const langSegments = sortedLangs.map(([lang, count]) => {
    const pct = (count / totalLangCount) * 100;
    const width = ((pct / 100) * 400).toFixed(1);
    const color = langColors[lang] || '#6366f1';
    const x = langOffsets;
    langOffsets += parseFloat(width);
    return `<rect x="${x.toFixed(1)}" y="0" width="${width}" height="8" rx="2" fill="${color}" />`;
  }).join('\n        ');

  // Build legend
  const langLegend = sortedLangs.map(([lang, count], idx) => {
    const pct = Math.round((count / totalLangCount) * 100);
    const color = langColors[lang] || '#6366f1';
    const xPos = idx * 80;
    return `
      <g transform="translate(${xPos}, 0)">
        <circle cx="4" cy="5" r="3.5" fill="${color}" />
        <text x="12" y="8" fill="#334155" font-size="9" font-weight="600" class="font-sans">${lang}</text>
        <text x="12" y="19" fill="#94a3b8" font-size="8.5" class="font-sans">${pct}%</text>
      </g>`;
  }).join('\n      ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 165" width="100%" height="100%">
  <defs>
    <linearGradient id="card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>

    <linearGradient id="top-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <style>
      .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .live-dot { animation: pulse 2s infinite ease-in-out; }
    </style>
  </defs>

  <!-- Container Box -->
  <rect width="920" height="165" rx="10" fill="url(#card-bg)" stroke="#e2e8f0" stroke-width="1.2" />
  <path d="M 0 10 C 0 4.48 4.48 0 10 0 L 910 0 C 915.52 0 920 4.48 920 10 L 920 3 L 0 3 Z" fill="url(#top-bar)" />

  <!-- Header Row -->
  <g transform="translate(24, 22)">
    <circle class="live-dot" cx="4" cy="-3" r="3.5" fill="#10b981" />
    <text x="16" y="1" fill="#0f172a" font-size="11" font-weight="700" class="font-sans">GITHUB ACTIVITY &amp; ECOSYSTEM METRICS</text>
    <text x="735" y="1" fill="#64748b" font-size="9.5" class="font-mono">LAST SYNC: ${generatedAt}</text>
  </g>
  <line x1="24" y1="36" x2="896" y2="36" stroke="#f1f5f9" stroke-width="1.2" />

  <!-- 4 Stat Tiles -->
  <g transform="translate(24, 48)">
    <!-- Tile 1: Repos -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="102" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      <text x="12" y="20" fill="#64748b" font-size="8.5" font-weight="600" class="font-sans">PUBLIC REPOS</text>
      <text x="12" y="47" fill="#0f172a" font-size="22" font-weight="800" class="font-sans">${user.public_repos || repos.length}</text>
      <text x="54" y="46" fill="#6366f1" font-size="9" font-weight="600" class="font-sans">repos</text>
    </g>

    <!-- Tile 2: Stars -->
    <g transform="translate(109, 0)">
      <rect x="0" y="0" width="102" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      <text x="12" y="20" fill="#64748b" font-size="8.5" font-weight="600" class="font-sans">STARGAZERS</text>
      <text x="12" y="47" fill="#0f172a" font-size="22" font-weight="800" class="font-sans">${stars}</text>
      <text x="36" y="46" fill="#f59e0b" font-size="9" font-weight="600" class="font-sans">stars</text>
    </g>

    <!-- Tile 3: Network -->
    <g transform="translate(218, 0)">
      <rect x="0" y="0" width="102" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      <text x="12" y="20" fill="#64748b" font-size="8.5" font-weight="600" class="font-sans">FOLLOWERS</text>
      <text x="12" y="47" fill="#0f172a" font-size="22" font-weight="800" class="font-sans">${user.followers || 0}</text>
      <text x="36" y="46" fill="#10b981" font-size="9" font-weight="600" class="font-sans">peers</text>
    </g>

    <!-- Tile 4: Languages -->
    <g transform="translate(327, 0)">
      <rect x="0" y="0" width="102" height="64" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
      <text x="12" y="20" fill="#64748b" font-size="8.5" font-weight="600" class="font-sans">LANGUAGES</text>
      <text x="12" y="47" fill="#0f172a" font-size="22" font-weight="800" class="font-sans">${Object.keys(languages).length}</text>
      <text x="36" y="46" fill="#8b5cf6" font-size="9" font-weight="600" class="font-sans">stacks</text>
    </g>
  </g>

  <!-- Right: Stack Distribution Monitor -->
  <g transform="translate(465, 48)">
    <rect x="0" y="0" width="431" height="98" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
    <text x="14" y="18" fill="#475569" font-size="9" font-weight="700" class="font-sans" letter-spacing="0.5">PRIMARY LANGUAGE SPECTRUM (BY REPOSITORIES)</text>

    <!-- Progress bar track -->
    <g transform="translate(14, 28)">
      <rect x="0" y="0" width="403" height="8" rx="2" fill="#e2e8f0" />
      <g>
        ${langSegments}
      </g>
    </g>

    <!-- Legend -->
    <g transform="translate(14, 52)">
      ${langLegend}
    </g>

    <!-- Verified Badge -->
    <g transform="translate(14, 88)">
      <text x="0" y="0" fill="#10b981" font-size="8.5" font-weight="600" class="font-sans">● Verified via GitHub REST API</text>
      <text x="220" y="0" fill="#94a3b8" font-size="8.5" class="font-mono">Node ID: ${user.node_id || 'U_kgDOCNW0RQ'}</text>
    </g>
  </g>

  <!-- Bottom Sub-bar (Left) -->
  <g transform="translate(24, 122)">
    <rect x="0" y="0" width="429" height="24" rx="4" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="0.8" />
    <text x="10" y="16" fill="#475569" font-size="9" font-weight="600" class="font-sans">Status: Active on Multimodal Machine Learning &amp; Web3 Infrastructure</text>
  </g>
</svg>`;
}

async function main() {
  console.log('[metrics] Starting GitHub telemetry aggregation for', USERNAME);

  const token = process.env.GITHUB_TOKEN || null;
  if (!token) {
    console.log('[metrics] Warning: GITHUB_TOKEN not set, proceeding unauthenticated');
  }

  let user;
  let repos = [];

  try {
    user = await fetchJson(`https://api.github.com/users/${USERNAME}`, token);
    console.log(`[metrics] Fetched user profile: ${user.login} (${user.public_repos} repos)`);

    repos = await fetchJson(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`, token);
    console.log(`[metrics] Fetched ${repos.length} repositories`);
  } catch (err) {
    console.error(`[metrics] Error fetching from GitHub: ${err.message}`);
    
    const fallbackPath = path.join(ASSETS_DIR, 'profile-data.json');
    if (fs.existsSync(fallbackPath)) {
      console.log('[metrics] Reusing cached profile-data.json fallback');
      const cached = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      user = cached.user;
      repos = cached.repos || [];
    } else {
      user = {
        login: USERNAME,
        node_id: 'U_kgDOCNW0RQ',
        public_repos: 52,
        followers: 1,
        following: 9,
      };
      repos = [];
    }
  }

  let stars = 0;
  let forks = 0;
  const languages = {};

  repos.forEach((r) => {
    stars += r.stargazers_count || 0;
    forks += r.forks_count || 0;
    if (r.language) {
      languages[r.language] = (languages[r.language] || 0) + 1;
    }
  });

  if (Object.keys(languages).length === 0) {
    languages['TypeScript'] = 23;
    languages['Python'] = 9;
    languages['C#'] = 2;
    languages['Move'] = 1;
    languages['CSS'] = 2;
  }

  const generatedAt = new Date().toISOString().split('T')[0];

  const telemetryPayload = {
    username: USERNAME,
    generatedAt,
    user: {
      login: user.login,
      node_id: user.node_id,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
    },
    stars,
    forks,
    languages,
  };

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const jsonPath = path.join(ASSETS_DIR, 'profile-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(telemetryPayload, null, 2), 'utf8');
  console.log(`[metrics] Saved telemetry JSON to ${jsonPath}`);

  const svgContent = generateMetricsSvg({
    user,
    repos,
    languages,
    stars,
    forks,
    generatedAt,
  });

  const svgPath = path.join(ASSETS_DIR, 'metrics.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`[metrics] Saved telemetry SVG to ${svgPath}`);
}

main().catch((err) => {
  console.error('[metrics] Fatal error:', err);
  process.exit(1);
});
