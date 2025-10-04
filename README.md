# RPSLS dApp

A decentralized Rock Paper Scissors Lizard Spock game built on Ethereum. Players commit their moves on-chain, play against each other, and settle disputes automatically through smart contracts.

## Overview

This application implements a trustless version of RPSLS where:

- Player 1 creates a game with a commitment hash (move + salt)
- Player 2 joins by submitting their move with matching stake
- Player 1 reveals their move to determine the winner
- Smart contract handles payouts automatically
- Timeout mechanisms prevent games from stalling indefinitely

## Tech Stack

**Frontend**

- Next.js 15.5 with App Router
- React 18 with TypeScript
- Ethers.js 6.15 for blockchain interaction
- TailwindCSS for styling
- Zustand for state management

**Backend**

- Next.js API routes
- Redis for game state and notifications
- Supabase for real-time updates

**Smart Contracts**

- Solidity contract on Sepolia testnet
- Commitment scheme for secure move hiding
- Timeout functions for stuck games

## Getting Started

### Prerequisites

You'll need:

- Node.js 18+
- MetaMask or compatible wallet
- Sepolia testnet ETH

### Environment Variables

Create a `.env.local` file:

```bash
# Blockchain
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key

# Redis
REDIS_URL=your_redis_url

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── components/     # React components
│   ├── game/[id]/      # Individual game pages
│   └── api/            # API routes
├── contracts/          # Contract ABIs
├── hooks/              # Custom React hooks
├── lib/                # Core utilities
├── services/           # API service layer
├── stores/             # Zustand stores
├── types/              # TypeScript types
└── utils/              # Helper functions
```

## Key Components

### Custom Hooks

**useGameState** - Manages blockchain game state with real-time updates
**useRevealMove** - Handles move revelation for Player 1
**useMoveSelection** - Processes Player 2's move submission
**useTimeout** - Implements timeout logic for stuck games
**useGameSync** - Real-time game updates via Supabase

### Core Libraries

**contract.ts** - Smart contract interaction layer
**provider.ts** - Consistent RPC provider to avoid sync issues
**metamask.ts** - Wallet connection with mobile support
**supabase.ts** - Real-time game synchronization
**redis.ts** - Persistent storage for game history

### Game Flow

1. Player 1 connects wallet, creates game with opponent address and stake
2. System generates salt, creates commitment hash, deploys contract
3. Player 2 receives notification, joins game with matching stake
4. Player 1 reveals move after Player 2 plays
5. Contract determines winner and distributes funds
6. Both players can claim timeout if opponent doesn't respond

## Important Notes

### Blockchain Sync

The app uses a consistent Infura RPC endpoint for all read operations to prevent users from seeing different blockchain states. Write operations still use the user's MetaMask provider.

### Timeout Safety

Timeout functions include a 10-second safety buffer beyond the 5-minute blockchain timeout to prevent transaction reverts from premature calls.

### Move Commitment

Player 1's move is never revealed until Player 2 has played, ensuring fair gameplay. The commitment hash is generated from the move number and a random 32-byte salt.

## Development

The codebase prioritizes:

- Type safety with TypeScript
- Clean separation of concerns
- Efficient state management
- Proper error handling

Comments in the code explain complex logic like blockchain timing issues, BigInt conversions, and timeout scenarios. Redundant comments have been removed.

## Contract Details

The RPS contract is deployed on Sepolia and includes:

- Commitment-reveal scheme for Player 1
- Direct move submission for Player 2
- Automatic winner calculation
- Timeout functions for both players
- Stake handling and payout logic
