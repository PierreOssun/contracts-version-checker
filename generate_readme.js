const fs = require('fs');
const path = require('path');

function getLatestJsonFile() {
    const files = fs.readdirSync('.')
        .filter(file => file.startsWith('contract_versions_') && file.endsWith('.json'))
        .sort()
        .reverse();
    return files[0];
}

function generateReadmeTables(data) {
    const ethereumNetworks = ['BaseMainnet', 'OPMainnet'];
    const sepoliaNetworks = ['OsakiSepolia', 'MinatoSepolia', 'BaseSepolia', 'OpSepolia'];

    function createTable(networks, title) {
        let table = `### ${title}\n\n`;
        table += `Last updated: ${new Date().toUTCString()}\n\n`;
        table += '| Contract | ' + networks.join(' | ') + ' |\n';
        table += '|' + '-|'.repeat(networks.length + 1) + '\n';

        for (const [contract, versions] of Object.entries(data.contracts)) {
            table += `| ${contract} | `;
            for (const network of networks) {
                const version = versions[network]?.version || 'N/A';
                const address = versions[network]?.address;
                if (version !== 'N/A' && address) {
                    const baseUrl = versions[network].network === 'ethereum' 
                        ? 'https://etherscan.io/address/' 
                        : 'https://sepolia.etherscan.io/address/';
                    table += `[${version}](${baseUrl}${address}) | `;
                } else {
                    table += `${version} | `;
                }
            }
            table = table.trim() + '\n';
        }

        return table;
    }

    const ethereumTable = createTable(ethereumNetworks, 'Ethereum Networks');
    const sepoliaTable = createTable(sepoliaNetworks, 'Sepolia Networks');

    return ethereumTable + '\n' + sepoliaTable;
}

function updateReadme(tables) {
    const readmePath = 'README.md';
    let content = '';

    if (fs.existsSync(readmePath)) {
        content = fs.readFileSync(readmePath, 'utf8');
    }

    const ciInstructions = `
# Contract Version Checker

This repository contains a GitHub Actions workflow to automatically check and update contract versions.

## Running the CI

To run the CI and update the contract versions:

1. Go to the "Actions" tab in the GitHub repository.
2. Click on the "Refresh Version" workflow.
3. Click the "Run workflow" button.
4. Select the branch.
5. Click "Run workflow" to start the process.

The workflow will create a new pull request with the updated contract versions and README.md file.

`;

    const contractVersionsHeader = '## Contract Versions';

    if (content.includes(contractVersionsHeader)) {
        const [beforeTable, afterTable] = content.split(contractVersionsHeader);
        const afterTableContent = afterTable.split('\n\n').slice(1).join('\n\n');
        content = `${ciInstructions}${contractVersionsHeader}\n\n${tables}\n${afterTableContent}`;
    } else {
        content = `${ciInstructions}${contractVersionsHeader}\n\n${tables}\n${content}`;
    }

    fs.writeFileSync(readmePath, content);
    console.log('README.md has been updated with CI instructions, latest contract versions, and timestamp.');
}

function main() {
    const latestFile = getLatestJsonFile();
    if (!latestFile) {
        console.error('No contract versions JSON file found.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    const tables = generateReadmeTables(data);
    updateReadme(tables);
}

main();
