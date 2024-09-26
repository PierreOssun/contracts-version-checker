const fs = require('fs');
const ethers = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkMinatoVersion() {
  // Get RPC URL from .env file
  const rpcUrl = process.env.ETH_RPC_URL;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  // Load Minato contracts
  const minatoContracts = JSON.parse(fs.readFileSync('mintanoL1contracts.json', 'utf8'));

  // Get SystemConfigProxy address
  const systemConfigProxyAddress = minatoContracts.SystemConfigProxy;

  // ABI for the version() function
  const abi = ["function version() view returns (string)"];

  // Create contract instance
  const contract = new ethers.Contract(systemConfigProxyAddress, abi, provider);

  try {
    // Call version() function
    const version = await contract.version();

    // Prepare result
    const result = {
      SystemConfigProxy: systemConfigProxyAddress,
      version: version
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `minato_version_${timestamp}.json`;

    // Save result to JSON file
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));

    console.log(`Version information saved to ${filename}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMinatoVersion();
