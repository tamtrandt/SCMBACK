import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber, ethers } from 'ethers';
import * as ProductContract from '../abis/ProductManager.json';  
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SmartContractService {
  private contract: ethers.Contract | null = null;
  private walletAddress: string | null = null;

  constructor(private readonly configService: ConfigService,private readonly jwtService: JwtService,){
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(contractAddress, ProductContract.abi, provider);
  }

  generateToken(walletAddress: string): string {
    return this.jwtService.sign({ walletAddress });
  }

  getWalletAddress(): string {
    if (!this.walletAddress) throw new Error('Wallet address is not set. Please connect a wallet.');
    return this.walletAddress;
  }

  setWalletAddress(address: string): void {
    if (!ethers.utils.isAddress(address)) throw new Error('Invalid wallet address');
    this.walletAddress = address;
  }

  private getSigner(): ethers.providers.JsonRpcSigner {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const address = this.getWalletAddress();
    return provider.getSigner(address);
  }

  private getContractWithSigner(): ethers.Contract {
    if (!this.contract) throw new Error('Contract is not initialized.');
    const signer = this.getSigner();
    return this.contract.connect(signer);
  }

  // Decode an event from the contract logs
private decodeEvent(event: any) {
  return {
    tokenId: BigNumber.from(event[0]).toNumber(), // Convert tokenId from BigNumber to number
    action: event[1], // Action type (e.g., 'MINT')
    initiator: event[2], // Address of the initiator
    timestamp: new Date(BigNumber.from(event[3]).toNumber() * 1000).toISOString(), // Convert timestamp to ISO format
    additionalInfo: event[4], // Additional information (e.g., metadata URL or IPFS CID)
  };
}

// --------------------
// Create (Mint Product)
// --------------------
async mintProduct(
  tokenId: number,
  amount: number,
  metadataCID: string,
  price: string,
  quantity: number,
  status: string
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.mintProduct(
      tokenId,
      amount,
      metadataCID,
      price,
      quantity,
      status
    );

    // Wait for transaction confirmation
    const receipt = await transaction.wait();

    // Parse logs to find the "TokenStateChanged" event
    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null; // Ignore logs that cannot be decoded
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    // Decode event data if it exists
    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;

    // Return the transaction hash and decoded event data
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error minting product:", error);
    throw new Error("Minting product failed");
  }
}

// Call the storeEventCID function on the smart contract
async callStoreEventCID(tokenId: number, cid: string): Promise<void> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const tx = await contractWithSigner.storeEventCID(tokenId, cid);
    await tx.wait(); // Wait for transaction confirmation
  } catch (error) {
    console.error("Error calling storeEventCID:", error);
    throw new Error("Failed to store event CID");
  }
}
// --------------------
// Update (U)
// --------------------

async updatePrice(
  tokenId: number,
  newPrice: string
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.updatePrice(tokenId, newPrice);
    const receipt = await transaction.wait();

    // Parse logs to find the "TokenStateChanged" event
    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error updating price:", error);
    throw new Error("Updating price failed");
  }
}

async updateMetadata(
  tokenId: number,
  newMetadataCID: string
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.updateMetadata(tokenId, newMetadataCID);
    const receipt = await transaction.wait();

    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error updating metadata:", error);
    throw new Error("Updating metadata failed");
  }
}

async updateQuantity(
  tokenId: number,
  newQuantity: number
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.updateQuantity(tokenId, newQuantity);
    const receipt = await transaction.wait();

    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error updating quantity:", error);
    throw new Error("Updating quantity failed");
  }
}

async updateStatus(
  tokenId: number,
  newStatus: string
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.updateStatus(tokenId, newStatus);
    const receipt = await transaction.wait();

    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error updating status:", error);
    throw new Error("Updating status failed");
  }
}

 // --------------------
// Delete (D)
// --------------------

// Burn a product
async burnProduct(
  tokenId: number,
  amount: number
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.burnProduct(tokenId, amount);
    const receipt = await transaction.wait();

    // Parse logs to find the "TokenStateChanged" event
    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error burning product:", error);
    throw new Error("Burn product failed");
  }
}

// --------------------
// Read (R)
// --------------------

// Get metadata CID for a product
async getMetadataCID(tokenId: number): Promise<string> {
  if (!this.contract) {
    throw new Error("Contract is not initialized.");
  }
  return await this.contract.getMetadataCID(tokenId);
}

// Get detailed product info
async getProductInfo(tokenId: number): Promise<{
  metadata: string;
  price: string;
  quantity: number;
  status: string;
  owner: string;
}> {
  if (!this.contract) {
    throw new Error("Contract is not initialized.");
  }
  const [metadata, price, quantity, status, owner] =
    await this.contract.getProductInfo(tokenId);
  return { metadata, price, quantity, status, owner };
}

// Get all token IDs
async getAllTokenIds(): Promise<{ count: number; product_ids: number[] }> {
  try {
    const [count, productIds]: [ethers.BigNumber, ethers.BigNumber[]] =
      await this.contract.getAllTokenIds();

    return {
      count: count.toNumber(),
      product_ids: productIds.map((tokenId) => tokenId.toNumber()),
    };
  } catch (error) {
    console.error("Error fetching token IDs:", error);
    throw new Error("Error fetching token IDs");
  }
}

// Get all owners of a specific token
async getTokenOwners(tokenId: number): Promise<string[]> {
  try {
    return await this.contract.getTokenOwners(tokenId);
  } catch (error) {
    console.error("Error fetching token owners:", error);
    throw new Error("Error fetching token owners");
  }
}

// Get token balance for a specific wallet and token
async getTokenBalance(
  walletAddress: string,
  tokenId: number
): Promise<number> {
  try {
    const balance = await this.contract.balanceOf(walletAddress, tokenId);
    return balance.toNumber();
  } catch (error) {
    console.error("Error fetching token balance:", error);
    throw new Error("Failed to fetch token balance");
  }
}

// Get all transaction CIDs for a token
async getAllCIDs(tokenId: number): Promise<string[]> {
  try {
    return await this.contract.getTransactionCIDs(tokenId);
  } catch (error) {
    console.error("Error fetching CIDs:", error);
    throw new Error("Failed to fetch transaction CIDs");
  }
}

async buyTokens(
  tokenIds: number[],
  amounts: number[],
  totalPrice: ethers.BigNumber
): Promise<{ transactionHash: string; event: any }> {
  try {
    const contractWithSigner = this.getContractWithSigner();
    const transaction = await contractWithSigner.buyTokens(tokenIds, amounts, totalPrice, {
      value: totalPrice, // Pass ETH value to the transaction.
    });

    // Wait for transaction confirmation.
    const receipt = await transaction.wait();

    // Parse logs to extract the "TokenStateChanged" event.
    const eventLog = receipt.logs
      .map((log) => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null; // Ignore logs that cannot be parsed.
        }
      })
      .find((e) => e && e.name === "TokenStateChanged");

    // Decode event arguments if the event is found.
    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;

    // Return transaction details and event data.
    return {
      transactionHash: transaction.hash,
      event: decodedEvent,
    };
  } catch (error) {
    console.error("Error calling buyTokens:", error);
    throw new Error("Failed to complete token purchase");
  }
 }
 
}