const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

async function checkContractVersion(contract, provider) {
  const abi = ["function version() view returns (string)"];
  const contractInstance = new ethers.Contract(contract.address, abi, provider);

  try {
    const version = await contractInstance.version();
    return version;
  } catch (error) {
    return 'N/A';
  }
}

async function checkNetworkVersions(networkName, contractsFile, networkType) {
  if (!fileExists(contractsFile)) {
    console.error(`Error: ${contractsFile} does not exist.`);
    return null;
  }

  try {
    const rpcUrl = networkType === 'eth' ? process.env.ETHEREUM_RPC_URL : process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error(`${networkType === 'eth' ? 'ETHEREUM_RPC_URL' : 'SEPOLIA_RPC_URL'} is not set in the .env file`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contracts = JSON.parse(fs.readFileSync(contractsFile, 'utf8'));
    const results = {};

    for (const [contractName, address] of Object.entries(contracts)) {
      const version = await checkContractVersion({ address }, provider);
      results[contractName] = { address, version };
    }

    return {
      networkName,
      networkType: networkType === 'eth' ? 'ethereum' : 'sepolia',
      contracts: results
    };
  } catch (error) {
    console.error(`Error checking ${networkName} versions:`, error.message);
    return null;
  }
}

function reorganizeData(networks) {
  const contracts = {};

  for (const [networkName, networkData] of Object.entries(networks)) {
    for (const [contractName, contractInfo] of Object.entries(networkData.contracts)) {
      if (!contracts[contractName]) {
        contracts[contractName] = {};
      }
      contracts[contractName][networkName] = {
        network: networkData.networkType,
        version: contractInfo.version,
        address: contractInfo.address
      };
    }
  }

  return contracts;
}

async function checkAllVersions() {
  const networks = [
    { name: 'BaseMainnet', file: path.join('L1ContractsAddress', 'eth', 'BaseMainnet.json'), type: 'eth' },
    { name: 'OpMainnet', file: path.join('L1ContractsAddress', 'eth', 'OpMainnet.json'), type: 'eth' },
    { name: 'OsakiSepolia', file: path.join('L1ContractsAddress', 'sep', 'OsakiL1contracts.json'), type: 'sep' },
    { name: 'MinatoSepolia', file: path.join('L1ContractsAddress', 'sep', 'MinatoL1contracts.json'), type: 'sep' },
    { name: 'BaseSepolia', file: path.join('L1ContractsAddress', 'sep', 'BaseSepolia.json'), type: 'sep' },
    { name: 'OpSepolia', file: path.join('L1ContractsAddress', 'sep', 'OPSepolia.json'), type: 'sep' },
  ];

  const networksResult = {};

  for (const network of networks) {
    const networkResult = await checkNetworkVersions(network.name, network.file, network.type);
    if (networkResult) {
      networksResult[network.name] = networkResult;
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    contracts: reorganizeData(networksResult)
  };

  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `contract_versions_${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`Version information saved to ${filename}`);

  if (Object.keys(networksResult).length === 0) {
    console.error('Error: Unable to retrieve version information for any network.');
  } else {
    const failedNetworks = networks.filter(n => !networksResult[n.name]);
    failedNetworks.forEach(n => {
      console.error(`Warning: Unable to retrieve version information for ${n.name} network.`);
    });
  }
}

async function main() {
  await checkAllVersions();
}

main();
