## Frame V2 Integration In Vanilla JS

The goal of this document is to explain how to implement Frames V2 functionality in a vanilla JS app which uses some sort of bundler, aka you have `npm` or `yarn` or `bun` as part of your package.json.

### Installation

The frame SDK is hosted at https://www.npmjs.com/package/@farcaster/frame-sdk and can be installed by:

```
npm: npm i @farcaster/frame-sdk
yarn: yarn add @farcaster/frame-sdk
bun: bun i @farcaster/frame-sdk
```

### Setup

#### Importing:

You can import the Frames V2 SDK by using `import * as frame from '@farcaster/frame-sdk'`

The Frames V2 SDK can now be accessed via the `frame` object.

#### fc:frame

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

When your app is loaded and ready to go, you need to call `frame.sdk.actions.ready();` otherwise your frame will never get past the splash screen.

### SDK API:

The frame.sdk.context object looks like:

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
  const context = await frame.sdk.context

  if (!context || !context.user) {
    console.log('not in frame context')
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

BE SURE to await the variable, `frame.sdk.context` returns a Promise.


#### Opening Links:

Since the frame will be loaded in an iframe, you can not use normal `<a href>` links.

To open a URL, call `await frame.sdk.actions.openUrl({ url });`

#### Intent URLs:

You can use frame.sdk.actions to trigger specific events in Warpcast:

Creating a cast: 

```
const targetText = 'This is a sample text';
const targetURL = 'https://my-website.com';

const finalUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(targetText)}&embeds[]=${encodeURIComponent(targetURL)};`

await frame.sdk.actions.openUrl({ url: finalUrl })
```

### Profile Preview

To link to a profile page in Warpcast you can do: 

`await frame.sdk.actions.viewProfile({ fid })`

This will minimize your app and show their profile page.

#### Onchain events:

To make calls to the network, call `await frame.sdk.wallet.ethProvider.request({})`

IMPORTANT: By default there is no ethers or wagmi interaction, you HAVE to make all requests by calling ethProvider.request.

Example commands:

Checking chain Id:

```
const chainId = await frame.sdk.wallet.ethProvider.request({
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
await frame.sdk.wallet.ethProvider.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x2105' }] // Base mainnet chainId
});
```

Minting:

```
// Get the account
const accounts = await frame.sdk.wallet.ethProvider.request({
  method: 'eth_requestAccounts'
});
const walletAddress = accounts[0];

// Create the mint function signature
const mintFunctionSignature = '0x1249c58b'; // keccak256('mint()')

const txHash = await frame.sdk.wallet.ethProvider.request({
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
  const accounts = await frame.sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  // The user's primary ETH address is now listed under accounts[0]
  
  // Convert ETH to Wei
  const weiValue = this.ethToWei(amount);
  
  // Send transaction
  const txHash = await frame.sdk.wallet.ethProvider.request({
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
  const accounts = await frame.sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  const tx = await frame.sdk.wallet.ethProvider.request({
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

Calling a custom function on a contract

```
const CONTRACT_ADDRESS = '0x...' // The address to your contract

const functionSignature = '0x4fd66eae'; // An example, keccac256('getPlayerStats(address)').substring(0, 10)

try {
  // Get the user's wallet address
  const accounts = await frame.sdk.wallet.ethProvider.request({
    method: 'eth_requestAccounts'
  });
  
  if (!accounts || !accounts[0]) {
    throw new Error('No wallet connected');
  }

  const paddedAddress = '000000000000000000000000' + accounts[0].slice(2);

  const functionPayload = functionSignature + paddedAddress;

  contractData = await frame.sdk.wallet.ethProvider.request({
    method: 'eth_call',
    params: [{
        to: CONTRACT_ADDRESS,
        data: functionPayload,
        from: paddedAddress
    }, 'latest']
  }).catch(error => {
      console.log('Error response from contract:', error);
      console.error('Contract call failed:', {
          error,
          message: error?.message,
          data: error?.data,
          code: error?.code
      });
      throw error; // Re-throw if it's a different error
  });

  console.log('Raw contract response:', contractData);

  if (!contractData || !contractData === '0x') {
      console.log('Empty response from contract)
      return;
  }

  const data = contractData.slice(2);

  // Here you can parse the output of the data,
  // e.g. if it's 3 numbers of each 32 bytes (64 characters)
  // const fieldOne = parseInt(data.slice(0, 64), 16);
  // const fieldTwo = parseInt(data.slice(64, 128), 16);
  // const fieldThree = parseInt(data.slice(128, 192), 16);
} catch (error) {
  console.error('Error calling contract', error);
}
```

### Known Issues

1. Sometimes `await frame.sdk.context.user` returns an object which has a `user` object inside it, not the `{ fid, username }` it's supposed to.

Workaround:

```
const context = await frame.sdk.context;
let user = context.user;
if (user.user) {
  user = user.user
}
```

2. Adding two embeds to a URL causes the second one to disappear if the user modifies the cast intent text

Example:

```
const targetText = 'This is a sample text';
const targetURL = 'https://my-website.com';
const targetURLTwo = '' // Another link, or even a link to an image

const finalUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(targetText)}&embeds[]=${encodeURIComponent(targetURL)}&embeds[]=${encodeURIComponent(targetURLTwo)}`;

await sdk.actions.openUrl({ url: finalUrl })
```

While this will correctly create the cast intent and show the text and the target links, if the user modifies the text of the cast the second will link disappear.

Workaround: None currently known
