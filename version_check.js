const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

async function checkNetworkVersion(networkName, contractsFile) {
  if (!fileExists(contractsFile)) {
    console.error(`Error: ${contractsFile} does not exist.`);
    return null;
  }

  try {
    // Get RPC URL from .env file
    const rpcUrl = process.env.ETH_RPC_URL;
    if (!rpcUrl) {
      throw new Error('ETH_RPC_URL is not set in the .env file');
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
      version: version
    };
  } catch (error) {
    console.error(`Error checking ${networkName} version:`, error.message);
    return null;
  }
}

async function checkVersions() {
  const osakiFile = path.join('L1ContractsAddress', 'OsakiL1contracts.json');
  const minatoFile = path.join('L1ContractsAddress', 'MinatoL1contracts.json');

  const osakiVersion = await checkNetworkVersion('Osaki', osakiFile);
  const minatoVersion = await checkNetworkVersion('Minato', minatoFile);

  const result = {
    timestamp: new Date().toISOString(),
    networks: {
      Osaki: osakiVersion,
      Minato: minatoVersion
    }
  };

  // Create filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `network_versions_${timestamp}.json`;

  // Save result to JSON file
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));

  console.log(`Version information saved to ${filename}`);

  if (!osakiVersion && !minatoVersion) {
    console.error('Error: Unable to retrieve version information for any network.');
  } else {
    if (!osakiVersion) {
      console.error('Warning: Unable to retrieve version information for Osaki network.');
    }
    if (!minatoVersion) {
      console.error('Warning: Unable to retrieve version information for Minato network.');
    }
  }
}

checkVersions();
