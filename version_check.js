const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

async function checkNetworkVersion(networkName, contractsFile, networkType) {
  if (!fileExists(contractsFile)) {
    console.error(`Error: ${contractsFile} does not exist.`);
    return null;
  }

  try {
    // Get RPC URL from .env file based on network type
    const rpcUrl = networkType === 'eth' ? process.env.ETHEREUM_RPC_URL : process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error(`${networkType === 'eth' ? 'ETHEREUM_RPC_URL' : 'SEPOLIA_RPC_URL'} is not set in the .env file`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Load contracts
    const contracts = JSON.parse(fs.readFileSync(contractsFile, 'utf8'));

    // Get SystemConfigProxy address
    const systemConfigProxyAddress = contracts.SystemConfigProxy;

    // ABI for the version() function
    const abi = ["function version() view returns (string)"];

    // Create contract instance
    const contract = new ethers.Contract(systemConfigProxyAddress, abi, provider);

    // Call version() function
    const version = await contract.version();

    return {
      SystemConfigProxy: systemConfigProxyAddress,
      version: version,
      networkType: networkType === 'eth' ? 'ethereum' : 'sepolia'
    };
  } catch (error) {
    console.error(`Error checking ${networkName} version:`, error.message);
    return null;
  }
}

async function checkVersions() {
  const networks = [
    { name: 'BaseMainnet', file: path.join('L1ContractsAddress', 'eth', 'BaseMainnet.json'), type: 'eth' },
    { name: 'OpMainnet', file: path.join('L1ContractsAddress', 'eth', 'OpMainnet.json'), type: 'eth' },
    { name: 'OsakiSepolia', file: path.join('L1ContractsAddress', 'sep', 'OsakiL1contracts.json'), type: 'sep' },
    { name: 'MinatoSepolia', file: path.join('L1ContractsAddress', 'sep', 'MinatoL1contracts.json'), type: 'sep' },
    { name: 'BaseSepolia', file: path.join('L1ContractsAddress', 'sep', 'BaseSepolia.json'), type: 'sep' },
    { name: 'OpSepolia', file: path.join('L1ContractsAddress', 'sep', 'OPSepolia.json'), type: 'sep' },
  ];

  const result = {
    timestamp: new Date().toISOString(),
    networks: {}
  };

  for (const network of networks) {
    const version = await checkNetworkVersion(network.name, network.file, network.type);
    result.networks[network.name] = version;
  }

  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `network_versions_${timestamp}.json`;

  // Save result to JSON file
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));

  console.log(`Version information saved to ${filename}`);

  const successfulNetworks = Object.values(result.networks).filter(v => v !== null);
  if (successfulNetworks.length === 0) {
    console.error('Error: Unable to retrieve version information for any network.');
  } else {
    const failedNetworks = networks.filter(n => result.networks[n.name] === null);
    failedNetworks.forEach(n => {
      console.error(`Warning: Unable to retrieve version information for ${n.name} network.`);
    });
  }
}

checkVersions();
