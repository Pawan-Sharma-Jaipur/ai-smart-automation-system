const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

const web3 = new Web3('http://127.0.0.1:7545');

const deployContract = async () => {
  try {
    const contractPath = path.join(__dirname, 'AutomationLogger.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
      language: 'Solidity',
      sources: {
        'AutomationLogger.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts['AutomationLogger.sol']['AutomationLogger'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    const accounts = await web3.eth.getAccounts();
    const deployAccount = accounts[0];

    console.log('Deploying contract from account:', deployAccount);

    const AutomationLogger = new web3.eth.Contract(abi);
    const deployedContract = await AutomationLogger.deploy({
      data: '0x' + bytecode
    }).send({
      from: deployAccount,
      gas: 3000000
    });

    console.log('\n✓ Contract deployed successfully!');
    console.log('Contract Address:', deployedContract.options.address);
    console.log('\nUpdate your backend/.env file with:');
    console.log(`CONTRACT_ADDRESS=${deployedContract.options.address}`);
    console.log(`ADMIN_ACCOUNT=${deployAccount}`);

    fs.writeFileSync(
      path.join(__dirname, 'contract-info.json'),
      JSON.stringify({
        address: deployedContract.options.address,
        abi: abi
      }, null, 2)
    );

    console.log('\n✓ Contract info saved to contract-info.json');
  } catch (error) {
    console.error('Deployment failed:', error);
  }
};

deployContract();
