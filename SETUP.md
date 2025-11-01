# NFT Marketplace DApp Setup Guide

This guide will help you set up and run the Jay's NFT Marketplace DApp built on the Sui blockchain.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Optional: Pinata IPFS Setup](#optional-pinata-ipfs-setup)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

- **Git** (optional, for cloning repositories)
  - Download from [git-scm.com](https://git-scm.com/)

- **Sui Wallet Extension** (for testing the DApp)
  - Install [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil) for Chrome/Brave
  - Or use [Sui Wallet](https://www.suiwallet.com/) for mobile

## Project Structure

```
jays-nft-marketplace-dapp/
├── nft-marketplace-frontend/     # Main frontend application
│   ├── src/                      # Source code
│   ├── public/                   # Public assets
│   ├── package.json              # Dependencies
│   └── .env                      # Environment variables (create this)
├── example of simple dapp.../    # Example DApp reference
└── front-end-design/             # UI design reference
```

The main application is located in the `nft-marketplace-frontend` directory.

## Installation

### Step 1: Navigate to the Project Directory

Open your terminal/command prompt and navigate to the main frontend directory:

```bash
cd nft-marketplace-frontend
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- React and React DOM
- Sui DApp Kit (`@mysten/dapp-kit`, `@mysten/sui`)
- React Router
- Tailwind CSS
- TypeScript
- Vite (build tool)

**Expected output:** The installation may take a few minutes. You should see a success message when complete.

## Environment Configuration

The application requires environment variables to connect to your deployed smart contract. You need to create a `.env` file in the `nft-marketplace-frontend` directory.

### Step 1: Create the `.env` File

Create a new file named `.env` in the `nft-marketplace-frontend` directory. You can copy the example file:

```bash
# On Windows (PowerShell)
Copy-Item ENV.EXAMPLE .env

# On Mac/Linux
cp ENV.EXAMPLE .env
```

Or create a new file:

```bash
# On Windows (PowerShell)
New-Item -Path .env -ItemType File

# On Mac/Linux
touch .env
```

### Step 2: Configure Environment Variables

Open the `.env` file and add the following variables. Replace the placeholder values with your actual deployed contract information:

```env
# Sui Network Configuration
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Smart Contract Configuration
# Replace with your deployed package ID from the publish transaction
VITE_PACKAGE_ID=0xYOUR_PACKAGE_ID_HERE

# Marketplace Object ID (from deployment, type: Marketplace)
VITE_MARKETPLACE_OBJECT_ID=0xYOUR_MARKETPLACE_OBJECT_ID_HERE

# Module Names
VITE_MARKETPLACE_MODULE=jays_nft_marketplace
VITE_NFT_MODULE=jays_nft_marketplace

# Function Names
VITE_FUNC_MINT=mint_to_sender
VITE_FUNC_LIST=list_nft_for_sale
VITE_FUNC_BUY=buy_nft
VITE_FUNC_CANCEL=cancel_listing
VITE_FUNC_WITHDRAW=withdraw_marketplace_fees

# Type Definitions
# Replace PACKAGE_ID with your actual package ID
VITE_NFT_TYPE=0xYOUR_PACKAGE_ID::jays_nft_marketplace::JaysChainNFT
VITE_LISTING_TYPE=0xYOUR_PACKAGE_ID::jays_nft_marketplace::Listing

# Admin Configuration
# Replace with the address that deployed the contract (for admin features)
VITE_ADMIN_ADDRESS=0xYOUR_ADMIN_ADDRESS_HERE

# Optional: Pinata IPFS Configuration (for image uploads)
# See "Optional: Pinata IPFS Setup" section below
VITE_PINATA_JWT=your_pinata_jwt_token_here
VITE_PINATA_GATEWAY=gateway.pinata.cloud
```

### Step 3: Get Your Contract Deployment Details

If you haven't deployed your contract yet, you'll need to:

1. **Deploy your Sui Move smart contract** to Sui Testnet
2. **Note the Package ID** from the deployment transaction
3. **Note the Marketplace Object ID** (the shared object ID from the `init` function)
4. **Note your Admin Address** (the address that deployed the contract)

**Note:** There's an `ENV.EXAMPLE` file in the `nft-marketplace-frontend` directory that contains example values. You can copy it to `.env` and update it with your actual deployment details.

## Running the Application

### Development Mode

To start the development server:

```bash
npm run dev
```

The application will start and you should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to `http://localhost:5173/`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the build with:

```bash
npm run preview
```

## Optional: Pinata IPFS Setup

The application supports uploading NFT images directly to IPFS using Pinata. This is optional - users can also provide image URLs manually.

### Step 1: Create a Pinata Account

1. Go to [Pinata.cloud](https://pinata.cloud)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your JWT Token

1. Log in to your Pinata dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **New Key**
4. Give it a name (e.g., "NFT Marketplace")
5. Select permissions:
   - ✅ `pinFileToIPFS` (required)
6. Click **Create**
7. Copy the **JWT Token** (you won't be able to see it again)

### Step 3: Add to `.env`

Add the following to your `.env` file:

```env
VITE_PINATA_JWT=your_jwt_token_here
VITE_PINATA_GATEWAY=gateway.pinata.cloud
```

**Note:** If you don't set `VITE_PINATA_JWT`, the minting form will still work but users will need to provide image URLs manually instead of uploading files.

## Additional Resources

- [Sui Developer Documentation](https://docs.sui.io/)
- [Sui Move Programming](https://docs.sui.io/build/move)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

---

**Happy building! 🚀**

