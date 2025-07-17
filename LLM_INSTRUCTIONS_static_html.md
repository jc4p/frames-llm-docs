## Mini Apps Integration In Static HTML

The goal of this document is to explain how to implement Mini Apps functionality in a minimal static HTML app without npm or yarn or bun involved.

### Setup

1. Import the Mini Apps SDK:

Somewhere in your `<head>`, insert:

`<script src="https://cdn.jsdelivr.net/npm/@farcaster/miniapp-sdk/dist/index.min.js"></script>`

2. Interact with the SDK:

```
// NOTE: Because it's await, you need to wrap your code in a function like this:
document.addEventListener('DOMContentLoaded', async () => {

  // You can now use the Mini Apps SDK under the namespace miniapp.sdk

  // Remove the splash screen and start your mini app
  miniapp.sdk.actions.ready();
})
```

3. fc:frame

To actually get your app to be recognized as a frame, you need a 

```
<meta name="fc:frame" content='{"version":"next", ...}' />
```

Meta tag in your root HTML.

The content of the fc:frame is stringifed JSON like:

```
type FrameEmbed = {
  // Frame spec version. Required.
  // Example: "next"
  version: 'next';

  // Frame image.
  // Max 512 characters.
  // Image must be 3:2 aspect ratio and less than 10 MB.
  // Example: "https://yoink.party/img/start.png"
  imageUrl: string;

  // Button attributes
  button: {
    // Button text.
    // Max length of 32 characters.
    // Example: "Yoink Flag"
    title: string;

    // Action attributes
    action: {
      // Action type. Must be "launch_frame".
      type: 'launch_frame';

      // App name
      // Max length of 32 characters.
      // Example: "Yoink!"
      name: string;

      // Frame launch URL.
      // Max 512 characters.
      // Example: "https://yoink.party/"
      url: string;

      // Splash image URL.
      // Max 512 characters.
      // Image must be 200x200px and less than 1MB.
      // Example: "https://yoink.party/img/splash.png"
      splashImageUrl: string;

      // Hex color code.
      // Example: "#eeeee4"
      splashBackgroundColor: string;
    };
  };
};
```

### Loading

When your app is loaded and ready to go, you need to call `miniapp.sdk.actions.ready();` otherwise your mini app will never get past the splash screen.

### SDK API:

The miniapp.sdk.context object looks like:

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
  const context = await miniapp.sdk.context

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

BE SURE to await the variable, `miniapp.sdk.context` returns a Promise.


#### Opening Links:

Since the mini app will be loaded in an iframe, you can not use normal `<a href>` links.

To open a URL, call `await miniapp.sdk.actions.openUrl({ url });`

#### Intent URLs:

You can use miniapp.sdk.actions to trigger specific events in Warpcast:

Creating a cast: 

```
import { sdk } from '@farcaster/miniapp-sdk'

await miniapp.sdk.actions.composeCast({
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

`await miniapp.sdk.actions.viewProfile({ fid })`

This will minimize your app and show their profile page.

#### Onchain events:

To make calls to the network, call `await miniapp.sdk.wallet.ethProvider.request({})`

IMPORTANT: The ethProvider can only handle write operations and very basic reads. It supports:
- `eth_sendTransaction` - for sending transactions
- `signTypedDataV4` - for signing typed data
- Basic operations like `eth_chainId`, `eth_requestAccounts`, and `wallet_switchEthereumChain`

For anything involving `eth_call` or other read operations beyond the basics listed above, you need to use viem or wagmi with a custom (or mainnet) RPC URL. The built-in ethProvider cannot handle complex read operations.

Example commands:

Checking chain Id:

```
const chainId = await miniapp.sdk.wallet.ethProvider.request({
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
await miniapp.sdk.wallet.ethProvider.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x2105' }] // Base mainnet chainId
});
```

Minting:

```
// Get the account
const accounts = await miniapp.sdk.wallet.ethProvider.request({
  method: 'eth_requestAccounts'
});
const walletAddress = accounts[0];

// Create the mint function signature
const mintFunctionSignature = '0x1249c58b'; // keccak256('mint()')

const txHash = await miniapp.sdk.wallet.ethProvider.request({
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
  const accounts = await miniapp.sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  // The user's primary ETH address is now listed under accounts[0]
  
  // Convert ETH to Wei
  const weiValue = this.ethToWei(amount);
  
  // Send transaction
  const txHash = await miniapp.sdk.wallet.ethProvider.request({
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
  const accounts = await miniapp.sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  const tx = await miniapp.sdk.wallet.ethProvider.request({
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

### Known Issues

1. Sometimes `await miniapp.sdk.context.user` returns an object which has a `user` object inside it, not the `{ fid, username }` it's supposed to.

Workaround:

```
const context = await miniapp.sdk.context;
let user = context.user;
if (user.user) {
  user = user.user
}
```

2. Adding two embeds to a URL causes the second one to disappear if the user modifies the cast intent text

Example:

```
import { sdk } from '@farcaster/miniapp-sdk'

await miniapp.sdk.actions.composeCast({
  text: 'This is a sample text',
  embeds: ['https://my-website.com', 'https://another-link.com'] // Second link, or even a link to an image
})
```

While this will correctly create the cast intent and show the text and the target links, if the user modifies the text of the cast the second will link disappear.

Workaround: None currently known
