import { ethers } from 'ethers';
import contractArtifact from '../contracts/RPS.json';
import { Move, MOVE_TO_NUMBER } from '@/types';

export async function getContract(
    contractAddress: string,
    signer: ethers.Signer
) {
    return new ethers.Contract(contractAddress, contractArtifact.abi, signer);
}

export async function createNewGame(
    player2Address: string,
    stakeAmount: ethers.BigNumberish,
    move: Move,
    signer: ethers.Signer
) {
    // Generate random salt
    const salt = ethers.toBigInt(ethers.randomBytes(32));

    // Convert move string to number for the contract
    const moveNumber = MOVE_TO_NUMBER[move];

    // Convert stake amount to Wei if it's a string
    const stakeInWei = typeof stakeAmount === 'string' 
        ? ethers.parseEther(stakeAmount)
        : stakeAmount;

    // Create commitment hash: keccak256(abi.encodePacked(move, salt))
    const commitmentHash = ethers.solidityPackedKeccak256(
        ['uint8', 'uint256'],
        [moveNumber, salt]
    );

    const factory = new ethers.ContractFactory(
        contractArtifact.abi,
        contractArtifact.bytecode,
        signer
    );

    const contract = await factory.deploy(commitmentHash, player2Address, {
        value: stakeInWei,
    });

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    // VERIFICATION: Test that the contract is actually working
    console.log('🔍 Verifying deployed contract at:', contractAddress);
    try {
        // Test basic contract calls to ensure it's properly deployed
        const j1Address = await (contract as any).j1();
        const j2Address = await (contract as any).j2();
        const contractStake = await (contract as any).stake();
        
        console.log('✅ Contract verification successful:', {
            j1: j1Address,
            j2: j2Address,
            stake: contractStake.toString(),
            contractAddress
        });
        
        // Verify the values match what we expect
        if (j1Address === ethers.ZeroAddress) {
            throw new Error('Contract j1 address is zero - deployment may have failed');
        }
        if (j2Address.toLowerCase() !== player2Address.toLowerCase()) {
            throw new Error(`Contract j2 address mismatch: expected ${player2Address}, got ${j2Address}`);
        }
        if (contractStake.toString() !== stakeInWei.toString()) {
            throw new Error(`Contract stake mismatch: expected ${stakeInWei}, got ${contractStake}`);
        }
        
    } catch (error) {
        console.error('❌ Contract verification failed:', error);
        throw new Error(`Contract deployed but verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
        contractAddress,
        salt: salt.toString(),
    };
}

export async function play(
    contractAddress: string,
    move: Move,
    stakeAmount: ethers.BigNumberish,
    signer: ethers.Signer
) {
    const contract = await getContract(contractAddress, signer);
    const moveNumber = MOVE_TO_NUMBER[move];
    
    // Convert stake amount to Wei if it's a string
    const stakeInWei = typeof stakeAmount === 'string' 
        ? ethers.parseEther(stakeAmount)
        : stakeAmount;
        
    return await contract.play(moveNumber, { value: stakeInWei });
}

export async function solve(
    contractAddress: string,
    move: number,
    salt: string,
    signer: ethers.Signer
) {
    const contract = await getContract(contractAddress, signer);
    return await contract.solve(move, salt);
}

export async function j1Timeout(
    contractAddress: string,
    signer: ethers.Signer
) {
    const contract = await getContract(contractAddress, signer);
    return await contract.j1Timeout();
}

export async function j2Timeout(
    contractAddress: string,
    signer: ethers.Signer
) {
    const contract = await getContract(contractAddress, signer);
    return await contract.j2Timeout();
}

export async function getGameState(
    contractAddress: string,
    signer: ethers.Signer
) {
    const contract = await getContract(contractAddress, signer);
    
    // Get user address for debugging
    const userAddress = await signer.getAddress();

    // CACHE BUSTING: Force fresh blockchain calls with latest block
    const provider = signer.provider;
    const latestBlock = await provider!.getBlockNumber();
    
    // Use 'latest' instead of specific block to avoid sync issues between nodes
    const callOptions = { blockTag: 'latest' as const };
    
    console.log(`🔍 Fetching from block: latest (node reports: ${latestBlock})`);

    const [j1, j2, stake, c2, c1Hash, lastAction] = await Promise.all([
        contract.j1(callOptions),
        contract.j2(callOptions),
        contract.stake(callOptions),
        contract.c2(callOptions),
        contract.c1Hash(callOptions),
        contract.lastAction(callOptions),
    ]);

            // Enhanced debugging - log raw blockchain data
            console.log(`🔍 RAW BLOCKCHAIN DATA for ${userAddress.slice(0, 8)} (block ${latestBlock}):`, {
                contract: contractAddress.slice(0, 10) + '...',
                j1: j1.slice(0, 8) + '...',
                j2: j2.slice(0, 8) + '...',
                stake: stake.toString(),
                c2: c2.toString(),
                c1Hash: c1Hash.slice(0, 10) + '...',
                lastAction: lastAction.toString(),
                timestamp: new Date().toISOString()
            });

    return {
        j1: j1,
        j2: j2,
        stake: stake.toString(),
        c2: c2,
        c1Hash: c1Hash,
        lastAction: lastAction.toString(),
        hasPlayer2Played: c2 > 0,
    };
}

export async function checkWinner(
    contractAddress: string,
    move1: number,
    move2: number,
    signer: ethers.Signer
) {
    const contract = await getContract(contractAddress, signer);
    return await contract.win(move1, move2);
}

/**
 * Determine the actual game outcome using the contract's win function
 * Returns: 'j1-wins' | 'j2-wins' | 'tie'
 */
export async function determineGameOutcome(
    contractAddress: string,
    move1: number,
    move2: number,
    signer: ethers.Signer
): Promise<'j1-wins' | 'j2-wins' | 'tie'> {
    const contract = await getContract(contractAddress, signer);
    
    // Check if J1 beats J2
    const j1BeatsJ2 = await contract.win(move1, move2);
    if (j1BeatsJ2) {
        return 'j1-wins';
    }
    
    // Check if J2 beats J1
    const j2BeatsJ1 = await contract.win(move2, move1);
    if (j2BeatsJ1) {
        return 'j2-wins';
    }
    
    // If neither wins, it's a tie
    return 'tie';
}
