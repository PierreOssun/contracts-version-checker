const fs = require('fs');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkNetworkVersion(networkName, contractsFile) {
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
  try {
    const osakiVersion = await checkNetworkVersion('Osaki', 'L1ContractsAddress/OsakiL1contracts.json');
    const minatoVersion = await checkNetworkVersion('Minato', 'L1ContractsAddress/MinatoL1contracts.json');

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
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkVersions();
