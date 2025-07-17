## Mini Apps Integration In NextJS

The goal of this document is to explain how to implement Mini Apps functionality in a NextJS app.

### Installation

The Mini Apps SDK is hosted at https://www.npmjs.com/package/@farcaster/miniapp-sdk and can be installed by:

```
npm: npm i @farcaster/miniapp-sdk
yarn: yarn add @farcaster/miniapp-sdk
bun: bun i @farcaster/miniapp-sdk
```

### Setup

1. Create a `/components/FrameInit.jsx`

```
'use client';

import { useEffect } from 'react';
import { initializeFrame } from '@/lib/frame';

export function FrameInit() {
  useEffect(() => {
    initializeFrame();
  }, []);

  return null;
}
```

2. Import the FrameInit into your layout:

```
import { FrameInit } from "@/components/FrameInit";
...
export default function RootLayout({ children }) {
  return (
      ...
      <body>
      <div>
        {children}
        <FrameInit />
      </div>
    </body>
  )
}
```

3. Create  `/lib/frame.js`

```
import { sdk } from '@farcaster/miniapp-sdk'

export async function initializeFrame() {
  const context = await sdk.context

  if (!context || !context.user) {
    console.log('not in mini app context')
    return
  }

  const user = context.user

  window.userFid = user.fid;

  // You can now use the window.userFid in any of your React code, e.g. using a useEffect that listens for it to be set
  // or trigger a custom event or anything you want

  // Call the ready function to remove your splash screen when in a mini app
  await sdk.actions.ready();
}
```

4. Initialize the fc:frame metadata

In your page.js:

```
export const metadata = {
  title: 'My Page',
  description: 'Description of my page',
  other: {
    'fc:frame': JSON.stringify({
      version: "next",
      imageUrl: "link-to-a-3:2-preview-image",
      button: {
        title: "Try now!",
        action: {
          type: "launch_frame",
          name: "your-frame-name",
          url: "your-app-url",
          splashImageUrl: "your-splash-image-url",
          splashBackgroundColor: "hex-of-your-splash-background-color"
        }
      }
    })
  }
};

export default function Page() {
  // Your page code
}
```


### Loading

When your app is loaded and ready to go, you need to call `sdk.actions.ready();` otherwise your mini app will never get past the splash screen.

### SDK API:

The sdk.context object looks like:

```
export type FrameContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  location?: FrameLocationContext;
  client: {
    clientFid: number;
    added: boolean;
    safeAreaInsets?: SafeAreaInsets;
    notificationDetails?: FrameNotificationDetails;
  };
};
```

#### User Authentication:

```
document.addEventListener(async () => {
  const context = await sdk.context

  if (!context || !context.user) {
    console.log('not in mini app context')
    return
  }

  const user = context.user

  console.log('Received user', {
    fid: user.fid,
    username: user.username
  })

  // Do something with the user object
})
```

BE SURE to await the variable, `sdk.context` returns a Promise.


#### Opening Links:

Since the mini app will be loaded in an iframe, you can not use normal `<a href>` links.

To open a URL, call `await sdk.actions.openUrl({ url });`

#### Intent URLs:

You can use sdk.actions to trigger specific events in Warpcast:

Creating a cast: 

```
import { sdk } from '@farcaster/miniapp-sdk'

await sdk.actions.composeCast({
  text: 'This is a sample text',
  embeds: ['https://my-website.com']
})
```

Parameters:
- `text` (optional): Type: string - Suggested text for the body of the cast. Mentions can be included using the human-readable form (e.g. @farcaster).
- `embeds` (optional): Type: [] | [string] | [string, string] - Suggested embeds. Max two.
- `parent` (optional): Type: { type: 'cast'; hash: string } - Suggested parent of the cast.
- `close` (optional): Type: boolean - Whether the app should be closed when this action is called. If true the app will be closed and the action will resolve with no result.
- `channelKey` (optional): Type: string - Whether the cast should be posted to a channel.

### Profile Preview

To link to a profile page in Warpcast you can do: 

`await sdk.actions.viewProfile({ fid })`

This will minimize your app and show their profile page.

#### Onchain events:

To make calls to the network, call `await sdk.wallet.ethProvider.request({})`

IMPORTANT: The ethProvider can only handle write operations and very basic reads. It supports:
- `eth_sendTransaction` - for sending transactions
- `signTypedDataV4` - for signing typed data
- Basic operations like `eth_chainId`, `eth_requestAccounts`, and `wallet_switchEthereumChain`

For anything involving `eth_call` or other read operations beyond the basics listed above, you need to use viem or wagmi with a custom (or mainnet) RPC URL. The built-in ethProvider cannot handle complex read operations.

Example commands:

Checking chain Id:

```
const chainId = await sdk.wallet.ethProvider.request({
  method: 'eth_chainId'
});

console.log('Connected to network with chainId:', chainId);
const chainIdDecimal = typeof chainId === 'number' ? chainId : parseInt(chainId, 16);

if (chainIdDecimal !== 8453) {
  console.error(`Please connect to Base Mainnet. Current network: ${chainIdDecimal} (${chainId})`);
} else {
  console.log('Confirmed to be on Base')
}
```

Switching to base:

```
await sdk.wallet.ethProvider.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x2105' }] // Base mainnet chainId
});
```

Minting:

```
// Get the account
const accounts = await sdk.wallet.ethProvider.request({
  method: 'eth_requestAccounts'
});
const walletAddress = accounts[0];

// Create the mint function signature
const mintFunctionSignature = '0x1249c58b'; // keccak256('mint()')

const txHash = await sdk.wallet.ethProvider.request({
  method: 'eth_sendTransaction',
  params: [{
    from: walletAddress,
    to: contractAddress,
    data: mintFunctionSignature
  }]
});
```

Sending an ETH transaction:

```
ethToWei(eth) {
  // Convert to BigInt and multiply by 10^18
  const wei = BigInt(Math.floor(eth * 1e18)).toString(16);
  return '0x' + wei;
}

try {
  const amount = 0.001; // Or your actual value

  const to = '0x....' // ETH address you want to send the amount to

  // Get the user's wallet address
  const accounts = await sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  // The user's primary ETH address is now listed under accounts[0]
  
  // Convert ETH to Wei
  const weiValue = this.ethToWei(amount);
  
  // Send transaction
  const txHash = await sdk.wallet.ethProvider.request({
    method: 'eth_sendTransaction',
    params: [{
      from: accounts[0],
      to: to,
      value: weiValue
    }]
  });
  
  console.log('Transaction sent:', txHash);
} catch (error) {
  // Either the transaction failed or the user cancelled it
  console.error('Error sending ETH transaction:', error);
}
```

Transfering a token:

```
ethToWei(eth) {
  // Convert to BigInt and multiply by 10^18
  const wei = BigInt(Math.floor(eth * 1e18)).toString(16);
  return '0x' + wei;
}

const price = 0.001; // Or your actual value

const transferFunctionSignature = '0xa9059cbb'; // keccac256('transfer(address,uint256)').substring(0, 10)

const tokenContractAddress = '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe' // HIGHER's contract address, for example

const recipient = '0x...'; // ETH address to recieve the tokens
const recipientPadded = recipient.slice(2).padStart(64, '0');

const amountHex = ethToWei(price);
const amountNoPrefix = amountHex.startsWith('0x') ? amountHex.slice(2) : amountHex;
const paddedAmount = amountNoPrefix.padStart(64, '0');

const data = `${transferFunctionSignature}${recipientPadded}${paddedAmount}`;

try {
  // Get the user's wallet address
  const accounts = await sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  const tx = await sdk.wallet.ethProvider.request({
    method: 'eth_sendTransaction',
    params: [{
      from: accounts[0],
      to: tokenContractAddress,
      data: data,
      value: '0x0'
    }]
  });
  console.log('Transaction sent:', tx);
} catch (error) {
  // Either the transaction failed or the user cancelled it
  console.error('Error sending transaction', error);
}
```

