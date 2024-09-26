const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkContractVersions() {
  const contractsFile = path.join('L1ContractsAddress', 'sep', 'MinatoL1contracts.json');
  
  if (!fs.existsSync(contractsFile)) {
    console.error(`Error: ${contractsFile} does not exist.`);
    return;
  }

  const contracts = JSON.parse(fs.readFileSync(contractsFile, 'utf8'));
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!rpcUrl) {
    console.error('Error: SEPOLIA_RPC_URL is not set in the .env file');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // ABI for the version() function
  const versionAbi = ["function version() view returns (string)"];

  for (const [contractName, address] of Object.entries(contracts)) {
    try {
      const contract = new ethers.Contract(address, versionAbi, provider);
      let version;
      
      try {
        version = await contract.version();
      } catch (error) {
        version = 'N/A';
      }

      console.log(`${contractName}: ${version}`);
    } catch (error) {
      console.error(`Error checking ${contractName} version:`, error.message);
    }
  }
}

checkContractVersions();
