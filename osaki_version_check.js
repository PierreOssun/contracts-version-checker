const { ethers } = require('ethers');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

async function checkOsakiVersion() {
  try {
    // Get RPC URL from .env file
    const rpcUrl = process.env.ETH_RPC_URL;
    if (!rpcUrl) {
      throw new Error('ETH_RPC_URL is not set in the .env file');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Load Osaki contracts
    const osakiContracts = JSON.parse(fs.readFileSync('OsakiL1contracts.json', 'utf8'));

    // Get SystemConfigProxy address
    const systemConfigProxyAddress = osakiContracts.SystemConfigProxy;

    // ABI for the version() function
    const abi = ["function version() view returns (string)"];

    // Create contract instance
    const contract = new ethers.Contract(systemConfigProxyAddress, abi, provider);

    // Call version() function
    const version = await contract.version();

    // Prepare result
    const result = {
      SystemConfigProxy: systemConfigProxyAddress,
      version: version
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `osaki_version_${timestamp}.json`;

    // Save result to JSON file
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));

    console.log(`Version information saved to ${filename}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOsakiVersion();
