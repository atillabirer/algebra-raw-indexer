import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";

import { FrontierEvmDatasource } from "@subql/frontier-evm-processor";

// Can expand the Datasource processor types via the genreic param
const project: SubstrateProject<FrontierEvmDatasource> = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "moonbeam-evm-starter",
  description: `A basic Frontier EVM example project with an event and call handler. Read more
    about this at https://university.subquery.network/create/frontier/. This
    project can be use as a starting point for developing your SubQuery project`,
  runner: {
    node: {
      name: "@subql/node",
      version: ">=3.0.1",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* The genesis hash of the network (hash of block 0) */
    chainId:
      "0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d",
    /**
     * This endpoint must be a public non-pruned archive node
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * You can get them from OnFinality for free https://app.onfinality.io
     * https://documentation.onfinality.io/support/the-enhanced-api-service
     */
    endpoint: ["https://api-moonbeam.dwellir.com/5e6927bb-9acb-466f-a45e-4df46b29b82b"],
    // Optionally provide the HTTP endpoint of a full chain dictionary to speed up processing
    dictionary: "https://api.subquery.network/sq/subquery/moonbeam-dictionary",
    chaintypes: {
      file: "./dist/chaintypes.js",
    },
  },
  dataSources: [
    {
      // This is the datasource for Moonbeam's Native Substrate processor
      kind: "substrate/FrontierEvm",
      startBlock: 2772018,
      processor: {
        file: "./node_modules/@subql/frontier-evm-processor/dist/bundle.js",
        options: {
          abi: "AlgebraPool",
          address: "0xB13B281503F6eC8A837Ae1a21e86a9caE368fCc5", // FLARE token https://moonscan.io/token/0xe3e43888fa7803cdc7bea478ab327cf1a0dc11a7
        },
      },
      assets: new Map([["AlgebraPool", { file: "./algebrapool.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            handler: "handleMint",
            kind: "substrate/FrontierEvmEvent",
            filter: {
              topics: [
                "Mint(address sender,address owner,int24 bottomTick,int24 topTick,uint128 liquidityAmount,uint256 amount0,uint256 amount1)",
              ],
            },
          },
          {
            handler: "handleBurn",
            kind: "substrate/FrontierEvmEvent",
            filter: {
              topics: [
                "Burn(address owner,int24 bottomTick,int24 topTick, uint128 liquidityAmount, uint256 amount0, uint256 amount1)",
              ],
            },
          }
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
