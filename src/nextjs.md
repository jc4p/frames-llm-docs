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
