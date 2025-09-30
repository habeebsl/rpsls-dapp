import { ethers } from "ethers";
import contractArtifact from "../contracts/RPS.json";

export async function getContract(contractAddress: string, signer: ethers.Signer) {
    return new ethers.Contract(contractAddress, contractArtifact.abi, signer);
}

export async function createNewGame(
    player2Address: string, 
    stakeAmount: ethers.BigNumberish, 
    move: number,
    signer: ethers.Signer
) {
    // Generate random salt
    const salt = ethers.toBigInt(ethers.randomBytes(32));
    
    // Create commitment hash: keccak256(abi.encodePacked(move, salt))
    const commitmentHash = ethers.solidityPackedKeccak256(
        ["uint8", "uint256"], 
        [move, salt]
    );
    
    const factory = new ethers.ContractFactory(
        contractArtifact.abi, 
        contractArtifact.bytecode, 
        signer
    );
    
    const contract = await factory.deploy(commitmentHash, player2Address, {
        value: stakeAmount
    });
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    return {
        contractAddress,
        salt: salt.toString()
    };
}

export async function play(contractAddress: string, move: number, stakeAmount: ethers.BigNumberish, signer: ethers.Signer) {
    const contract = await getContract(contractAddress, signer);
    return await contract.play(move, { value: stakeAmount });
}

export async function solve(contractAddress: string, move: number, salt: string, signer: ethers.Signer) {
    const contract = await getContract(contractAddress, signer);
    return await contract.solve(move, salt);
}

export async function j1Timeout(contractAddress: string, signer: ethers.Signer) {
    const contract = await getContract(contractAddress, signer);
    return await contract.j1Timeout();
}

export async function j2Timeout(contractAddress: string, signer: ethers.Signer) {
    const contract = await getContract(contractAddress, signer);
    return await contract.j2Timeout();
}

export async function getGameState(contractAddress: string, signer: ethers.Signer) {
    const contract = await getContract(contractAddress, signer);
    
    const [j1, j2, stake, c2, lastAction] = await Promise.all([
        contract.j1(),
        contract.j2(),
        contract.stake(),
        contract.c2(),
        contract.lastAction()
    ]);
    
    return {
        player1: j1,
        player2: j2,
        stake: stake.toString(),
        player2Move: c2,
        lastAction: lastAction.toString(),
        hasPlayer2Played: c2 > 0
    };
}

export async function checkWinner(contractAddress: string, move1: number, move2: number, signer: ethers.Signer) {
    const contract = await getContract(contractAddress, signer);
    return await contract.win(move1, move2);
}