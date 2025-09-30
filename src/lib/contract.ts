import { ethers } from "ethers";
import contractArtifact from "../contracts/RPS.json";

export async function createNewGame(
    player2Address: string, 
    stakeAmount: ethers.BigNumberish, 
    move: number,
    signer: ethers.Signer
) {
    // Generate cryptographically secure random salt
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