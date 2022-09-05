import { Fragment, useState, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { ethers } from "ethers";
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Network, Alchemy } from 'alchemy-sdk';
import { Chart as ChartJS } from 'chart.js/auto' // eslint-disable-line no-unused-vars
import { Chart }            from 'react-chartjs-2' // eslint-disable-line no-unused-vars

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: 'xuovvv0aKRDWyRrDpgdJuZX4CAjnvfLe', // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
};

export default function Home() {

  const [contractAddress, setContractAddress] = useState('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE');
  const BLOCKLOOKBACKNUMBER = 20;  

  const options = {
    responsive: true,
    legend: {
      display: false
    }
  };
  const options3 = {
    responsive: true,
    legend: {
      display: false
    }
  };

  const [dataplot1, setDataplot1] = useState(null);
  const [dataplot2, setDataplot2] = useState(null);
  const [dataplot3, setDataplot3] = useState(null);
  const [tokensymbol, setTokensymbol] = useState(null);
  const [tokenname, setTokenname] = useState(null);
  const [tokenlogo, setTokenlogo] = useState(null);
  const [sampleTransaction, setSampleTransaction] = useState(null);
  const [latestBlockNumber, setLatestBlockNumber] = useState(null);
  const [latestBlockPlotted, setLatestBlockPlotted] = useState(null);

  useEffect(() => {

    const alchemy = new Alchemy(settings);

    const updateTokenMetadata = async () => {
      const metadata = await alchemy.core.getTokenMetadata(contractAddress);
      setTokensymbol(metadata.symbol);
      setTokenname(metadata.name);
      setTokenlogo(metadata.logo);
    }; 
    updateTokenMetadata();

    const filter = {
      address: contractAddress,
      topics: [
        ethers.utils.id("Transfer(address,address,uint256)")
      ]
    }

    alchemy.ws.on(filter, async (log,) => {
      const toBlockNumber = log.blockNumber;

      const latestBlock = await alchemy.core.getBlockNumber();
      console.log("The latest block number is ", latestBlock);

      if (latestBlockPlotted === 'undefined' || latestBlockPlotted !== toBlockNumber) {
        setLatestBlockPlotted(toBlockNumber);

        try {
            // request data via alchemy of all transfers related to this specific erc20 token
            const array = (await alchemy.core.getAssetTransfers({
                fromBlock: toBlockNumber - BLOCKLOOKBACKNUMBER,
                toBlock: toBlockNumber,
                withMetadata: false,
                excludeZeroValue: true,
                category: ["erc20"],
                contractAddresses: [contractAddress]
            })).transfers;

            // latestBlockNumber = parseInt(array[0].blockNum, 16);
            setLatestBlockNumber(toBlockNumber);

            const sample = array[array.length - 1]; // used as sample transaction on the frontend

            // ==== Create first the data for plots 2 and 3
            const blockNumbersForPlot = [];
            const plot2y = [];
            const plot3y = [];
            const alreadySeen = {};
            for (let index = 0; index < array.length; index++) {
                const element = array[index];
                
                if (!alreadySeen[element.blockNum]) {

                  // fetch the block
                  const theblock = await alchemy.core.getBlock(element.blockNum);
                  
                  blockNumbersForPlot.push(parseInt(element.blockNum, 16));
                  plot2y.push(parseInt(theblock.baseFeePerGas.toHexString(), 16) / Math.pow(10, 9));
                  plot3y.push(parseInt(theblock.gasUsed.toHexString(), 16) / parseInt(theblock.gasLimit.toHexString(), 16) * 100);
                }
                alreadySeen[element.blockNum] = true;
            }

            // ==== Now create the data for plot 1 -- this is the transfer volume
            const result = [];
            array.reduce(function(res, value) {
              if (!res[value.blockNum]) {
                res[value.blockNum] = { blockNum: value.blockNum, value: 0 };
                result.push(res[value.blockNum])
              }
              res[value.blockNum].value += value.value;
              return res;
            }, {});

            // convert to MMs
            const plot1y = result.map((data) => data.value / Math.pow(10, 6));

            const thedataplot1 = {
            labels: blockNumbersForPlot,
            datasets: [
              {
                label: 'Volume (millions)',
                data: plot1y,
                borderColor: '#55bae7',
                backgroundColor: '#55bae7',
                pointBackgroundColor: "#55bae7",
                pointBorderColor: "#55bae7"
              }
            ],
          };

            const thedataplot2 = {
            labels: blockNumbersForPlot,
            datasets: [
              {
                label: 'BASEFEE (Gwei)',
                data: plot2y,
                borderColor: '#C1E1C1',
                backgroundColor: '#C1E1C1',
                pointBackgroundColor: "#C1E1C1",
                pointBorderColor: "#C1E1C1"
              }
            ],
          };
            
            const thedataplot3 = {
            labels: blockNumbersForPlot,
            datasets: [
              {
                label: '(Gas used / Gas limit) in %',
                data: plot3y,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)'
              }
            ],
          };
          
          setDataplot1(thedataplot1);
          setDataplot2(thedataplot2);
          setDataplot3(thedataplot3);
          setSampleTransaction(sample);

        } catch(e) {
          console.log(e);
        }
    }
    });
    
    return () => {
      // clean up
      alchemy.ws.off(filter);
    };

  }, [latestBlockPlotted, setTokenlogo, setTokenname, setTokensymbol, contractAddress]);

  const updateRender = async () => {

      const alchemy = new Alchemy(settings);
    
      const latestBlock = await alchemy.core.getBlockNumber();
      console.log("The latest block number is ", latestBlock);
  
        try {
            // request data via alchemy of all transfers related to this specific erc20 token
            const array = (await alchemy.core.getAssetTransfers({
                fromBlock: latestBlock - BLOCKLOOKBACKNUMBER,
                toBlock: latestBlock,
                withMetadata: false,
                excludeZeroValue: true,
                category: ["erc20"],
                contractAddresses: [contractAddress]
            })).transfers;

            setLatestBlockNumber(latestBlock);
            const sample = array[array.length - 1]; // used as sample transaction on the frontend

            // ==== Create first the data for plots 2 and 3
            const blockNumbersForPlot = [];
            const plot2y = [];
            const plot3y = [];
            const alreadySeen = {};
            for (let index = 0; index < array.length; index++) {
                const element = array[index];

                if (!alreadySeen[element.blockNum]) {

                  // fetch the block
                  const theblock = await alchemy.core.getBlock(element.blockNum);

                  blockNumbersForPlot.push(parseInt(element.blockNum, 16));
                  plot2y.push(parseInt(theblock.baseFeePerGas.toHexString(), 16) / Math.pow(10, 9));
                  plot3y.push(parseInt(theblock.gasUsed.toHexString(), 16) / parseInt(theblock.gasLimit.toHexString(), 16) * 100);
                }
                alreadySeen[element.blockNum] = true;
            }

            // ==== Now create the data for plot 1 -- this is the transfer volume
            const result = [];
            array.reduce(function(res, value) {
              if (!res[value.blockNum]) {
                res[value.blockNum] = { blockNum: value.blockNum, value: 0 };
                result.push(res[value.blockNum])
              }
              res[value.blockNum].value += value.value;
              return res;
            }, {});

            // convert to MMs
            const plot1y = result.map((data) => data.value / Math.pow(10, 6));

            const thedataplot1 = {
            labels: blockNumbersForPlot,
            datasets: [
              {
                label: 'Volume (millions)',
                data: plot1y,
                borderColor: '#55bae7',
                backgroundColor: '#55bae7',
                pointBackgroundColor: "#55bae7",
                pointBorderColor: "#55bae7"
              }
            ],
          };

            const thedataplot2 = {
            labels: blockNumbersForPlot,
            datasets: [
              {
                label: 'BASEFEE (Gwei)',
                data: plot2y,
                borderColor: '#C1E1C1',
                backgroundColor: '#C1E1C1',
                pointBackgroundColor: "#C1E1C1",
                pointBorderColor: "#C1E1C1"
              }
            ],
          };
            
            const thedataplot3 = {
            labels: blockNumbersForPlot,
            datasets: [
              {
                label: '(Gas used / Gas limit) in %',
                data: plot3y,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)'
              }
            ],
          };
          
          setDataplot1(thedataplot1);
          setDataplot2(thedataplot2);
          setDataplot3(thedataplot3);
          setSampleTransaction(sample);

        } catch(e) {
          console.log(e);
        }
    
  };

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className="bg-gray-800">
        {() => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">                    
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              </div>
              <div className="border-t border-gray-700 pt-4 pb-3">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                  </div>
                  <div className="ml-3">
                  </div>
                  
                </div>
                <div className="mt-3 space-y-1 px-2">
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <a href="https://twitter.com/cryptojesperk" target="_blank" rel="noopener noreferrer">
          <button type="button" style={{marginTop: "10px", marginLeft: "4px"}} className="inline-flex items-center rounded-lg border border-transparent bg-indigo-500 px-3 py-2 text-sm font-small leading-4 text-white shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2">
                  <svg style={{marginRight: "4px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
        </svg>
        cryptojesperk
    </button>   
                </a>
        </div>
      </header>


      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* Replace with your content */}
          <div className="px-4 py-6 sm:px-0">

          <div className="grid grid-rows-2 grid-cols-3 gap-4 justify-items-center">

          <div className="col-span-3">
            <article className="prose lg:prose-xl">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">ERC20 Token Charting</h2>
            </article>
          </div>

          <div className="flex justify-center col-start-2 col-end-2">
              <div>
            <input
              type="text"
              value={contractAddress}
              style={{width: "600px", height: "60px", marginTop: "0px", borderWidth: "2px"}}
              className="block mb-2 p-4 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-300"
              placeholder="Input ERC20 token address"
              onChange={async (e) => {
                setContractAddress(e.target.value);
                const alchemy = new Alchemy(settings);
                const metadata = await alchemy.core.getTokenMetadata(e.target.value);
                setTokensymbol(metadata.symbol);
                setTokenname(metadata.name);
                setTokenlogo(metadata.logo);
                await updateRender();
              }}
            />
              <div><p className="text-sm font-medium text-gray-400" style={{marginLeft: "16px"}}>{tokenname}</p></div>
              <div><p className="text-sm font-medium text-gray-400" style={{marginLeft: "16px"}}>{tokenname} - {tokensymbol} <img alt="" className="inline" style={{height: "15px", marginBottom: "4px"}} src={tokenlogo}/></p></div>
              <div> <p className="text-sm font-medium text-gray-300" style={{marginLeft: "16px"}}>latest block: {latestBlockNumber}{sampleTransaction?<> - example tx hash: <a href={"https://etherscan.io/tx/" + sampleTransaction.hash} target="_blank" rel="noopener noreferrer">{sampleTransaction.hash}</a> </>: null}</p></div>
              <p className="text-sm font-medium"><a href="https://etherscan.io/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-4 underline">top erc20 tokens</a></p>
        </div>
        </div>

        <div className="col-start-3 col-end-3">
        </div>
        
       {/* next row */}
       <div className="col-span-3">
       <button type="button" onClick={async () => {await updateRender()}} style={{width: "120px"}} className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">update</button>
        </div>

      {/* LEFT CHART: TRANSFER VOLUME */}
      <div className="col-start-1 col-end-1">
              <div className="shadow-lg rounded-lg overflow-hidden">
          <div className="py-3 px-5 bg-gray-50">Transfer Volume (in million tokens)</div>
          
          {dataplot1 ?
          <>
          <Line
            height={400}
            style={{marginLeft: "20px", marginRight: "20px",
            marginBottom: "20px", marginTop: "20px"}}
            options={options}
            data={dataplot1}
          />
          <p className="text-sm font-medium text-gray-40" style={{marginBottom: "20px"}}></p>
          </>
          : null}
      </div>
</div>

    {/* MID CHART: Basefee */}
    <div className="col-start-2 col-end-2">
              <div className="shadow-lg rounded-lg overflow-hidden">
          <div className="py-3 px-5 bg-gray-50">Block BASEFEE</div>

          {dataplot2 ?
          <>
          <Line
            height={400}
            style={{marginLeft: "20px", marginRight: "20px",
            marginBottom: "20px", marginTop: "20px"}}
            options={options}
            data={dataplot2}
          />
          <p className="text-sm font-medium text-gray-40" style={{marginBottom: "20px"}}>block #</p>
          </>
          : null}
          
      </div>
      </div>

      {/* END CHART: Percent usage */}
    <div className="col-start-3 col-end-3">
              <div className="shadow-lg rounded-lg overflow-hidden">
          <div className="py-3 px-5 bg-gray-50">Block (Gas used / Gas limit) (%)</div>

          {dataplot3 ?
          <>
          <Line
            height={400}
            style={{marginLeft: "20px", marginRight: "20px",
            marginBottom: "20px", marginTop: "20px"}}
            options={options3}
            data={dataplot3}
          />
          <p className="text-sm font-medium text-gray-40" style={{marginBottom: "20px"}}></p>
          </>
          : null}
          
      </div>
      </div>


      </div>
          </div>

          {/* /End replace */}
        </div>
      </main>
    </div>
  );
}
