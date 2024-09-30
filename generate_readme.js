const fs = require('fs');
const path = require('path');

function getLatestJsonFile() {
    const files = fs.readdirSync('.')
        .filter(file => file.startsWith('contract_versions_') && file.endsWith('.json'))
        .sort()
        .reverse();
    return files[0];
}

function generateReadmeTable(data) {
    const networks = Object.keys(Object.values(data.contracts)[0]);
    let table = '| Contract | ' + networks.join(' | ') + ' |\n';
    table += '|' + '-|'.repeat(networks.length + 1) + '\n';

    for (const [contract, versions] of Object.entries(data.contracts)) {
        table += `| ${contract} | `;
        for (const network of networks) {
            table += `${versions[network]?.version || 'N/A'} | `;
        }
        table = table.trim() + '\n';
    }

    return table;
}

function updateReadme(table) {
    const readmePath = 'README.md';
    let content = '';

    if (fs.existsSync(readmePath)) {
        content = fs.readFileSync(readmePath, 'utf8');
    }

    const tableMarker = '<!-- CONTRACT_VERSIONS_TABLE -->';
    const tableEndMarker = '<!-- END_CONTRACT_VERSIONS_TABLE -->';

    if (content.includes(tableMarker) && content.includes(tableEndMarker)) {
        const beforeTable = content.split(tableMarker)[0];
        const afterTable = content.split(tableEndMarker)[1];
        content = `${beforeTable}${tableMarker}\n\n${table}\n${tableEndMarker}${afterTable}`;
    } else {
        content += `\n\n## Contract Versions\n\n${tableMarker}\n\n${table}\n${tableEndMarker}\n`;
    }

    fs.writeFileSync(readmePath, content);
    console.log('README.md has been updated with the latest contract versions.');
}

function main() {
    const latestFile = getLatestJsonFile();
    if (!latestFile) {
        console.error('No contract versions JSON file found.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    const table = generateReadmeTable(data);
    updateReadme(table);
}

main();
