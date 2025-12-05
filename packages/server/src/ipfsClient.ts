import axios from "axios";

// Using Pinata for IPFS (free tier)
// You can sign up at https://pinata.cloud and get API keys
const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

// Fallback to public IPFS gateway for reads
const PUBLIC_GATEWAY = "https://ipfs.io/ipfs";

export interface IPFSUploadResult {
    success: boolean;
    cid?: string;
    url?: string;
    error?: string;
}

export class IPFSClient {
    private hasPinataKeys: boolean;

    constructor() {
        this.hasPinataKeys = !!(PINATA_API_KEY && PINATA_SECRET_KEY);
        if (!this.hasPinataKeys) {
            console.warn("[IPFS] Pinata keys not configured. Using mock storage.");
        }
    }

    /**
     * Upload strategy code to IPFS
     */
    async uploadCode(code: string, metadata?: Record<string, any>): Promise<IPFSUploadResult> {
        if (!this.hasPinataKeys) {
            // Mock mode - store in memory and return fake CID
            return this.mockUpload(code);
        }

        try {
            const data = JSON.stringify({
                pinataContent: {
                    code,
                    metadata: metadata || {},
                    uploadedAt: new Date().toISOString()
                },
                pinataMetadata: {
                    name: `strategy_${Date.now()}`
                }
            });

            const res = await axios.post(
                "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "pinata_api_key": PINATA_API_KEY,
                        "pinata_secret_api_key": PINATA_SECRET_KEY
                    }
                }
            );

            const cid = res.data.IpfsHash;
            return {
                success: true,
                cid,
                url: `${PINATA_GATEWAY}/${cid}`
            };
        } catch (e: any) {
            console.error("IPFS upload error:", e.message);
            return {
                success: false,
                error: e.message || "Upload failed"
            };
        }
    }

    /**
     * Fetch strategy code from IPFS
     */
    async fetchCode(cid: string): Promise<{ code: string; metadata?: any } | null> {
        // Check mock storage first
        if (mockStorage.has(cid)) {
            return mockStorage.get(cid) || null;
        }

        try {
            // Try Pinata gateway first
            const url = this.hasPinataKeys
                ? `${PINATA_GATEWAY}/${cid}`
                : `${PUBLIC_GATEWAY}/${cid}`;

            const res = await axios.get(url, { timeout: 10000 });

            if (typeof res.data === "string") {
                return { code: res.data };
            }

            return {
                code: res.data.code || res.data,
                metadata: res.data.metadata
            };
        } catch (e: any) {
            console.error("IPFS fetch error:", e.message);
            return null;
        }
    }

    /**
     * Mock upload for development without Pinata keys
     */
    private mockUpload(code: string): IPFSUploadResult {
        // Generate a fake CID
        const hash = Buffer.from(code).toString("base64").slice(0, 46);
        const cid = `Qm${hash}`.replace(/[+/=]/g, "x");

        // Store in memory
        mockStorage.set(cid, { code, metadata: { mock: true } });

        console.log(`[IPFS Mock] Stored strategy with CID: ${cid}`);

        return {
            success: true,
            cid,
            url: `mock://${cid}`
        };
    }
}

// In-memory storage for mock mode
const mockStorage = new Map<string, { code: string; metadata?: any }>();

// Singleton
export const ipfsClient = new IPFSClient();
