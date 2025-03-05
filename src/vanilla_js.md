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