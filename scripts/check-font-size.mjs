import fs from 'node:fs';
import path from 'node:path';

const extensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx', '.php']);
const patterns = [
    /font-size\s*:\s*clamp\(\s*(\d*\.?\d+)(px|rem|em)/gi,
    /font-size\s*:\s*(\d*\.?\d+)(px|rem|em)/gi,
    /fontSize\s*:\s*['"]?(\d*\.?\d+)(px|rem|em)?/g,
    /text-\[(\d*\.?\d+)(px|rem|em)\]/g,
];
const violations = [];

function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            scan(file);
            continue;
        }
        if (!extensions.has(path.extname(file))) continue;

        const source = fs.readFileSync(file, 'utf8');
        for (const pattern of patterns) {
            for (const match of source.matchAll(pattern)) {
                const value = Number(match[1]);
                const unit = match[2] || 'px';
                if ((unit === 'px' && value < 16) || (unit !== 'px' && value < 1)) {
                    const line = source.slice(0, match.index).split('\n').length;
                    violations.push(`${file}:${line} ${match[0]}`);
                }
            }
        }
    }
}

scan('resources');

const variables = fs.readFileSync('resources/js/Styles/variables.css', 'utf8');
const tailwind = fs.readFileSync('tailwind.config.js', 'utf8');
for (const token of ['xs', 'sm']) {
    if (!new RegExp(`--text-${token}:\\s*1rem`).test(variables)) {
        violations.push(`resources/js/Styles/variables.css --text-${token} harus 1rem`);
    }
    if (!new RegExp(`${token}:\\s*\\['1rem'`).test(tailwind)) {
        violations.push(`tailwind.config.js text-${token} harus 1rem`);
    }
}

if (violations.length) {
    console.error(`Font di bawah 16px ditemukan:\n${violations.join('\n')}`);
    process.exit(1);
}

console.log('Semua ukuran font eksplisit minimal 16px.');
